import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
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
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { getFirstFile, type UploadedFilesMap } from '../../../common/types';
import {
  CreateRentalUseCase,
  ListRentalsUseCase,
  GetRentalStatsUseCase,
  GetRentalByIdUseCase,
  UpdateRentalUseCase,
  GetRentalFinancialConfigUseCase,
  UpsertRentalFinancialConfigUseCase,
  GetRentalFinancialBreakdownUseCase,
} from '../../../application/use-cases/rentals';
import { CreateRentalDto } from '../dtos/rentals/create-rental.dto';
import { UpdateRentalDto } from '../dtos/rentals/update-rental.dto';
import { UpsertRentalFinancialConfigDto } from '../dtos/rentals/upsert-rental-financial-config.dto';
import { PrismaService } from '../../database/prisma/prisma.service';
import { NotificationsService } from '../services/notifications.service';
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
    private readonly listRentalsUseCase: ListRentalsUseCase,
    private readonly getRentalStatsUseCase: GetRentalStatsUseCase,
    private readonly getRentalByIdUseCase: GetRentalByIdUseCase,
    private readonly updateRentalUseCase: UpdateRentalUseCase,
    private readonly getRentalFinancialConfigUseCase: GetRentalFinancialConfigUseCase,
    private readonly upsertRentalFinancialConfigUseCase: UpsertRentalFinancialConfigUseCase,
    private readonly getRentalFinancialBreakdownUseCase: GetRentalFinancialBreakdownUseCase,
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar alquileres (paginado)' })
  @ApiQuery({ name: 'applicationSlug', required: false, description: 'Slug de la aplicación (default: alquileres)' })
  @ApiQuery({ name: 'page', required: false, description: 'Página (1-based)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items por página' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por código, propiedad, inquilino o propietario' })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'EXPIRED', 'CANCELLED'] })
  @ApiResponse({ status: 200 })
  async list(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: 'ACTIVE' | 'EXPIRED' | 'CANCELLED',
  ) {
    return this.listRentalsUseCase.execute({
      applicationSlug: applicationSlug ?? 'alquileres',
      page: Math.max(1, parseInt(page ?? '1', 10)),
      limit: Math.min(50, Math.max(1, parseInt(limit ?? '10', 10))),
      search: search?.trim() || undefined,
      status,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estadísticas de alquileres' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiResponse({ status: 200 })
  async stats(@Query('applicationSlug') applicationSlug?: string) {
    return this.getRentalStatsUseCase.execute(applicationSlug ?? 'alquileres');
  }

  @Get(':id/financial-config')
  @ApiOperation({ summary: 'Obtener configuración financiera del alquiler' })
  @ApiResponse({ status: 200 })
  async getFinancialConfig(@Param('id') id: string) {
    return this.getRentalFinancialConfigUseCase.execute(id);
  }

  @Get(':id/financial-breakdown')
  @ApiOperation({ summary: 'Desglose financiero (utilidad, gastos, impuestos, agentes)' })
  @ApiResponse({ status: 200 })
  async getFinancialBreakdown(@Param('id') id: string) {
    const rental = await this.getRentalByIdUseCase.execute(id);
    if (!rental) return null;
    return this.getRentalFinancialBreakdownUseCase.execute(
      id,
      rental.monthlyAmount,
      rental.currency,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener alquiler por ID' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404 })
  async getById(@Param('id') id: string) {
    return this.getRentalByIdUseCase.execute(id);
  }

  @Put(':id/financial-config')
  @ApiOperation({ summary: 'Crear o actualizar configuración financiera del alquiler' })
  @ApiResponse({ status: 200 })
  async upsertFinancialConfig(
    @Param('id') id: string,
    @Body() dto: UpsertRentalFinancialConfigDto,
  ) {
    return this.upsertRentalFinancialConfigUseCase.execute(id, {
      currency: dto.currency,
      expenseType: dto.expenseType,
      expenseValue: dto.expenseValue,
      taxType: dto.taxType,
      taxValue: dto.taxValue,
      externalAgentId: dto.externalAgentId,
      externalAgentType: dto.externalAgentType,
      externalAgentValue: dto.externalAgentValue,
      externalAgentName: dto.externalAgentName,
      internalAgentId: dto.internalAgentId,
      internalAgentType: dto.internalAgentType,
      internalAgentValue: dto.internalAgentValue,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar alquiler' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404 })
  async update(@Param('id') id: string, @Body() dto: UpdateRentalDto) {
    return this.updateRentalUseCase.execute({
      id,
      startDate: dto.startDate,
      endDate: dto.endDate,
      currency: dto.currency,
      monthlyAmount: dto.monthlyAmount,
      securityDeposit: dto.securityDeposit,
      paymentDueDay: dto.paymentDueDay,
      notes: dto.notes,
      status: dto.status,
    });
  }

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

    try {
      const detail = await this.getRentalByIdUseCase.execute(rental.id);
      if (detail) {
        await this.notificationsService.notifyRentalCreated(
          rental.id,
          dto.applicationSlug ?? 'alquileres',
          detail.tenant.fullName,
          detail.property.addressLine,
        );
      }
    } catch {
      // No fallar el create si falla la notificación
    }

    return rental;
  }
}
