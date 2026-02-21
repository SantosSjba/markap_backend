import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
  CreateClientUseCase,
  ListClientsUseCase,
  GetClientStatsUseCase,
  GetClientByIdUseCase,
  UpdateClientUseCase,
} from '../../../application/use-cases/clients';
import { CreateClientDto, UpdateClientDto } from '../dtos/clients';
import { PrismaService } from '../../database/prisma/prisma.service';

@ApiTags('Clients')
@Controller('clients')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ClientsController {
  constructor(
    private readonly createClientUseCase: CreateClientUseCase,
    private readonly listClientsUseCase: ListClientsUseCase,
    private readonly getClientStatsUseCase: GetClientStatsUseCase,
    private readonly getClientByIdUseCase: GetClientByIdUseCase,
    private readonly updateClientUseCase: UpdateClientUseCase,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar clientes (paginado)' })
  @ApiQuery({ name: 'applicationSlug', required: false, description: 'Slug de la aplicación (default: alquileres)' })
  @ApiQuery({ name: 'page', required: false, description: 'Página (1-based)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items por página' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nombre, documento o email' })
  @ApiQuery({ name: 'clientType', required: false, enum: ['OWNER', 'TENANT'] })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filtrar por estado activo (true/false)' })
  @ApiResponse({ status: 200 })
  async list(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('clientType') clientType?: 'OWNER' | 'TENANT',
    @Query('isActive') isActive?: string,
  ) {
    return this.listClientsUseCase.execute({
      applicationSlug: applicationSlug ?? 'alquileres',
      page: Math.max(1, parseInt(page ?? '1', 10)),
      limit: Math.min(50, Math.max(1, parseInt(limit ?? '10', 10))),
      search: search?.trim() || undefined,
      clientType,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estadísticas de clientes' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiResponse({ status: 200 })
  async stats(@Query('applicationSlug') applicationSlug?: string) {
    return this.getClientStatsUseCase.execute(applicationSlug ?? 'alquileres');
  }

  @Post()
  @ApiOperation({ summary: 'Crear cliente' })
  @ApiResponse({ status: 201 })
  async create(@Body() dto: CreateClientDto) {
    return this.createClientUseCase.execute({
      applicationId: dto.applicationId,
      applicationSlug: dto.applicationSlug ?? 'alquileres',
      clientType: dto.clientType,
      documentTypeId: dto.documentTypeId,
      documentNumber: dto.documentNumber,
      fullName: dto.fullName,
      legalRepresentativeName: dto.legalRepresentativeName,
      legalRepresentativePosition: dto.legalRepresentativePosition,
      primaryPhone: dto.primaryPhone,
      secondaryPhone: dto.secondaryPhone,
      primaryEmail: dto.primaryEmail,
      secondaryEmail: dto.secondaryEmail,
      notes: dto.notes,
      address: dto.address,
    });
  }

  @Get('document-types')
  @ApiOperation({ summary: 'Listar tipos de documento' })
  @ApiResponse({ status: 200 })
  async getDocumentTypes() {
    return this.prisma.documentType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  @Get('districts')
  @ApiOperation({ summary: 'Listar distritos (con provincia y departamento)' })
  @ApiQuery({ name: 'provinceId', required: false })
  @ApiResponse({ status: 200 })
  async getDistricts(@Query('provinceId') provinceId?: string) {
    const where = provinceId ? { provinceId } : {};
    return this.prisma.district.findMany({
      where,
      include: {
        province: {
          include: { department: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener cliente por ID' })
  @ApiResponse({ status: 200 })
  async getById(@Param('id') id: string) {
    return this.getClientByIdUseCase.execute(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar cliente' })
  @ApiResponse({ status: 200 })
  async update(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.updateClientUseCase.execute(id, {
      clientType: dto.clientType,
      documentTypeId: dto.documentTypeId,
      documentNumber: dto.documentNumber,
      fullName: dto.fullName,
      legalRepresentativeName: dto.legalRepresentativeName,
      legalRepresentativePosition: dto.legalRepresentativePosition,
      primaryPhone: dto.primaryPhone,
      secondaryPhone: dto.secondaryPhone,
      primaryEmail: dto.primaryEmail,
      secondaryEmail: dto.secondaryEmail,
      notes: dto.notes,
      address: dto.address,
    });
  }
}
