import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { getFirstFile, type UploadedFilesMap } from '../../../common/types';
import { CreateRentalUseCase } from '../../../application/use-cases/rentals';
import { CreateRentalDto } from '../dtos/rentals/create-rental.dto';
import { PrismaService } from '../../database/prisma/prisma.service';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

const RENTAL_FILE_FIELDS = ['contractFile', 'deliveryActFile'] as const;
type RentalFileField = (typeof RENTAL_FILE_FIELDS)[number];

@ApiTags('Rentals')
@Controller('rentals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class RentalsController {
  constructor(
    private readonly createRentalUseCase: CreateRentalUseCase,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'contractFile', maxCount: 1 },
        { name: 'deliveryActFile', maxCount: 1 },
      ],
      { limits: { fileSize: 10 * 1024 * 1024 } }, // 10 MB
    ),
  )
  @ApiOperation({ summary: 'Crear alquiler (contrato)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        applicationSlug: { type: 'string', example: 'alquileres' },
        propertyId: { type: 'string', format: 'uuid' },
        tenantId: { type: 'string', format: 'uuid' },
        startDate: { type: 'string', example: '2025-01-01' },
        endDate: { type: 'string', example: '2026-01-01' },
        currency: { type: 'string', example: 'PEN' },
        monthlyAmount: { type: 'number', example: 2500 },
        securityDeposit: { type: 'number', example: 5000 },
        paymentDueDay: { type: 'number', example: 5 },
        notes: { type: 'string' },
        contractFile: { type: 'string', format: 'binary' },
        deliveryActFile: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201 })
  async create(
    @Body() dto: CreateRentalDto,
    @UploadedFiles()
    files?: UploadedFilesMap<RentalFileField>,
  ) {
    const rental = await this.createRentalUseCase.execute({
      applicationSlug: dto.applicationSlug ?? 'alquileres',
      propertyId: dto.propertyId,
      tenantId: dto.tenantId,
      startDate: dto.startDate,
      endDate: dto.endDate,
      currency: dto.currency ?? 'PEN',
      monthlyAmount: Number(dto.monthlyAmount),
      securityDeposit:
        dto.securityDeposit != null ? Number(dto.securityDeposit) : null,
      paymentDueDay: Number(dto.paymentDueDay) || 5,
      notes: dto.notes,
    });

    const uploadDir = join(process.cwd(), 'uploads', 'rentals', rental.id);
    await mkdir(uploadDir, { recursive: true });

    const contractFile = getFirstFile(files?.contractFile);
    const deliveryActFile = getFirstFile(files?.deliveryActFile);

    if (contractFile) {
      const f = contractFile;
      const safeName = `${Date.now()}_${(f.originalname || 'contract').replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = join(uploadDir, safeName);
      await writeFile(filePath, f.buffer);
      await (this.prisma as any).rentalAttachment.create({
        data: {
          rentalId: rental.id,
          type: 'CONTRACT',
          filePath: `rentals/${rental.id}/${safeName}`,
          originalFileName: f.originalname || 'contract',
        },
      });
    }
    if (deliveryActFile) {
      const f = deliveryActFile;
      const safeName = `${Date.now()}_${(f.originalname || 'delivery_act').replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = join(uploadDir, safeName);
      await writeFile(filePath, f.buffer);
      await (this.prisma as any).rentalAttachment.create({
        data: {
          rentalId: rental.id,
          type: 'DELIVERY_ACT',
          filePath: `rentals/${rental.id}/${safeName}`,
          originalFileName: f.originalname || 'delivery_act',
        },
      });
    }

    return rental;
  }
}
