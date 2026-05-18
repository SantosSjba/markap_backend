import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  HttpCode,
  HttpStatus,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { parseTenantIds } from '@common/utils/parse-tenant-ids.util';
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
import { RENTAL_PORT, type RentalPort } from '@application/ports';
import { CreateRentalDto } from '../dtos/rentals/create-rental.dto';
import { UpdateRentalDto } from '../dtos/rentals/update-rental.dto';
import { UpsertRentalFinancialConfigDto } from '../dtos/rentals/upsert-rental-financial-config.dto';
import { SaveCommunicationNoteDto } from '../dtos/rentals/save-communication-note.dto';
import { PrismaService } from '../../database/prisma/prisma.service';
import { GenArchivoService, NotificationsService } from '../../../application/services';
import type { UploadedFile as MulterUploadedFile } from '../../../common/types';

const RENTAL_FILE_FIELDS = ['contractFile', 'deliveryActFile'] as const;
type RentalFileField = (typeof RENTAL_FILE_FIELDS)[number];

@ApiTags('Rentals')
@Controller('rentals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class RentalsController {
  constructor(
    @Inject(RENTAL_PORT) private readonly rental: RentalPort,
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly genArchivo: GenArchivoService,
  ) {}

  private async persistRentalAttachment(
    rentalId: string,
    applicationSlug: string,
    type: 'CONTRACT' | 'DELIVERY_ACT',
    file: MulterUploadedFile,
  ): Promise<void> {
    const archivo = await this.genArchivo.upload(
      {
        applicationSlug,
        module: 'rentals',
        entityType: 'rental',
        entityId: rentalId,
        category: type,
      },
      file,
    );
    await this.prisma.rentalAttachment.deleteMany({
      where: { rentalId, type },
    });
    await this.prisma.rentalAttachment.create({
      data: {
        rentalId,
        type,
        archivoId: archivo.id,
        filePath: archivo.objectKey,
        originalFileName: archivo.originalFileName,
      },
    });
  }

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
    return this.rental.listRentals({
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
    return this.rental.getRentalStats(applicationSlug ?? 'alquileres');
  }

  @Get(':id/financial-config')
  @ApiOperation({ summary: 'Obtener configuración financiera del alquiler' })
  @ApiResponse({ status: 200 })
  async getFinancialConfig(@Param('id') id: string) {
    return this.rental.getRentalFinancialConfig(id);
  }

  @Get(':id/financial-breakdown')
  @ApiOperation({ summary: 'Desglose financiero (utilidad, gastos, impuestos, agentes)' })
  @ApiResponse({ status: 200 })
  async getFinancialBreakdown(@Param('id') id: string) {
    const rental = await this.rental.getRentalById(id);
    return this.rental.getRentalFinancialBreakdown(
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
    return this.rental.getRentalById(id);
  }

  @Put(':id/financial-config')
  @ApiOperation({ summary: 'Crear o actualizar configuración financiera del alquiler' })
  @ApiResponse({ status: 200 })
  async upsertFinancialConfig(
    @Param('id') id: string,
    @Body() dto: UpsertRentalFinancialConfigDto,
  ) {
    return this.rental.upsertRentalFinancialConfig(id, {
      currency: dto.currency,
      baseAmount: dto.baseAmount,
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
      internalAgentName: dto.internalAgentName,
    });
  }

  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'contractFile', maxCount: 1 },
        { name: 'deliveryActFile', maxCount: 1 },
      ],
      { limits: { fileSize: 10 * 1024 * 1024 } },
    ),
  )
  @ApiOperation({ summary: 'Actualizar alquiler' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404 })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRentalDto,
    @UploadedFiles() files?: UploadedFilesMap<RentalFileField>,
  ) {
    const tenantIds =
      dto.tenantIds !== undefined
        ? parseTenantIds(dto.tenantIds)
        : undefined;
    if (tenantIds !== undefined && tenantIds.length === 0) {
      throw new BadRequestException('Debe indicar al menos un inquilino');
    }

    const rental = await this.rental.updateRental({
      id,
      startDate: dto.startDate,
      endDate: dto.endDate,
      currency: dto.currency,
      monthlyAmount: dto.monthlyAmount != null ? Number(dto.monthlyAmount) : undefined,
      securityDeposit: dto.securityDeposit != null ? Number(dto.securityDeposit) : dto.securityDeposit,
      paymentDueDay: dto.paymentDueDay != null ? Number(dto.paymentDueDay) : undefined,
      notes: dto.notes,
      status: dto.status,
      enableExpirationAlerts: dto.enableExpirationAlerts,
      enableCollectionAlerts: dto.enableCollectionAlerts,
      tenantIds,
    });

    const contractFile = getFirstFile(files?.contractFile);
    const deliveryActFile = getFirstFile(files?.deliveryActFile);

    if (contractFile) {
      await this.persistRentalAttachment(id, 'alquileres', 'CONTRACT', contractFile);
    }
    if (deliveryActFile) {
      await this.persistRentalAttachment(id, 'alquileres', 'DELIVERY_ACT', deliveryActFile);
    }

    return rental;
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
    const tenantIds = parseTenantIds(dto.tenantIds, dto.tenantId);
    if (tenantIds.length === 0) {
      throw new BadRequestException('Debe indicar al menos un inquilino');
    }

    const rental = await this.rental.createRental({
      applicationSlug: dto.applicationSlug ?? 'alquileres',
      propertyId: dto.propertyId,
      tenantIds,
      startDate: dto.startDate,
      endDate: dto.endDate,
      currency: dto.currency ?? 'PEN',
      monthlyAmount: Number(dto.monthlyAmount),
      securityDeposit:
        dto.securityDeposit != null ? Number(dto.securityDeposit) : null,
      paymentDueDay: Number(dto.paymentDueDay) || 5,
      notes: dto.notes,
      enableExpirationAlerts: dto.enableExpirationAlerts ?? true,
      enableCollectionAlerts: dto.enableCollectionAlerts ?? true,
    });

    const appSlug = dto.applicationSlug ?? 'alquileres';
    const contractFile = getFirstFile(files?.contractFile);
    const deliveryActFile = getFirstFile(files?.deliveryActFile);

    if (contractFile) {
      await this.persistRentalAttachment(rental.id, appSlug, 'CONTRACT', contractFile);
    }
    if (deliveryActFile) {
      await this.persistRentalAttachment(rental.id, appSlug, 'DELIVERY_ACT', deliveryActFile);
    }

    try {
      const detail = await this.rental.getRentalById(rental.id);
      if (detail) {
        await this.notificationsService.notifyRentalCreated(
          rental.id,
          dto.applicationSlug ?? 'alquileres',
          detail.tenants.map((t) => t.fullName).join(', '),
          detail.property.addressLine,
        );
      }
    } catch {
      // No fallar el create si falla la notificación
    }

    return rental;
  }

  @Patch(':id/communication-note')
  @ApiOperation({ summary: 'Guardar nota de comunicación con el inquilino' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404 })
  async saveCommunicationNote(
    @Param('id') id: string,
    @Body() dto: SaveCommunicationNoteDto,
  ) {
    await this.prisma.rental.update({
      where: { id },
      data: {
        lastCommunicationNote: dto.note.trim(),
        lastCommunicationDate: new Date(),
      },
    });
    return { message: 'Nota guardada correctamente' };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar contrato (soft delete)' })
  @ApiResponse({ status: 200, description: 'Contrato cancelado correctamente' })
  @ApiResponse({ status: 404 })
  async cancel(@Param('id') id: string) {
    return this.rental.cancelRental(id);
  }
}
