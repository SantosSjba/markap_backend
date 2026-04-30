import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CLIENT_PORT, type ClientPort } from '@application/ports';
import { CreateClientDto, UpdateClientDto } from '../dtos/clients';
import { PrismaService } from '../../database/prisma/prisma.service';

@ApiTags('Clients')
@Controller('clients')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ClientsController {
  constructor(
    @Inject(CLIENT_PORT) private readonly clients: ClientPort,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar clientes (paginado)' })
  @ApiQuery({ name: 'applicationSlug', required: false, description: 'Slug de la aplicación (default: alquileres)' })
  @ApiQuery({ name: 'page', required: false, description: 'Página (1-based)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items por página' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nombre, documento o email' })
  @ApiQuery({
    name: 'clientType',
    required: false,
    enum: ['OWNER', 'TENANT', 'BUYER', 'RESIDENTIAL', 'CORPORATE'],
  })
  @ApiQuery({
    name: 'salesStatus',
    required: false,
    enum: ['PROSPECT', 'INTERESTED', 'CLIENT'],
    description: 'Filtrar embudo ventas (applicationSlug ventas)',
  })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filtrar por estado activo (true/false)' })
  @ApiResponse({ status: 200 })
  async list(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('clientType')
    clientType?: 'OWNER' | 'TENANT' | 'BUYER' | 'RESIDENTIAL' | 'CORPORATE',
    @Query('salesStatus') salesStatus?: 'PROSPECT' | 'INTERESTED' | 'CLIENT',
    @Query('isActive') isActive?: string,
  ) {
    return this.clients.listClients({
      applicationSlug: applicationSlug ?? 'alquileres',
      page: Math.max(1, parseInt(page ?? '1', 10)),
      limit: Math.min(50, Math.max(1, parseInt(limit ?? '10', 10))),
      search: search?.trim() || undefined,
      clientType,
      salesStatus,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estadísticas de clientes' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiResponse({ status: 200 })
  async stats(@Query('applicationSlug') applicationSlug?: string) {
    return this.clients.getClientStats(applicationSlug ?? 'alquileres');
  }

  @Post()
  @ApiOperation({ summary: 'Crear cliente' })
  @ApiResponse({ status: 201 })
  async create(@Body() dto: CreateClientDto) {
    return this.clients.createClient({
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
      salesStatus: dto.salesStatus,
      leadOrigin: dto.leadOrigin,
      assignedAgentId: dto.assignedAgentId,
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

  @Get('departments')
  @ApiOperation({ summary: 'Listar departamentos del Perú' })
  @ApiResponse({ status: 200 })
  async getDepartments() {
    return this.prisma.department.findMany({ orderBy: { name: 'asc' } });
  }

  @Get('provinces')
  @ApiOperation({ summary: 'Listar provincias por departamento' })
  @ApiQuery({ name: 'departmentId', required: false })
  @ApiResponse({ status: 200 })
  async getProvinces(@Query('departmentId') departmentId?: string) {
    const where = departmentId ? { departmentId } : {};
    return this.prisma.province.findMany({ where, orderBy: { name: 'asc' } });
  }

  @Get('districts')
  @ApiOperation({ summary: 'Listar distritos por provincia' })
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
  @ApiQuery({
    name: 'applicationSlug',
    required: false,
    description: 'Si se indica (ej. ventas), solo se devuelve si el cliente pertenece a esa aplicación',
  })
  @ApiResponse({ status: 200 })
  async getById(
    @Param('id') id: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.clients.getClientById(id, applicationSlug);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar cliente' })
  @ApiQuery({
    name: 'applicationSlug',
    required: false,
    description: 'Si se indica, el cliente debe pertenecer a esa aplicación',
  })
  @ApiResponse({ status: 200 })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.clients.updateClient(
      id,
      {
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
      salesStatus: dto.salesStatus,
      leadOrigin: dto.leadOrigin,
      assignedAgentId: dto.assignedAgentId,
      address: dto.address,
    },
      applicationSlug,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar cliente (soft delete)' })
  @ApiQuery({
    name: 'applicationSlug',
    required: false,
    description: 'Si se indica, el cliente debe pertenecer a esa aplicación',
  })
  @ApiResponse({ status: 200, description: 'Cliente eliminado correctamente' })
  @ApiResponse({ status: 404 })
  async remove(
    @Param('id') id: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.clients.deleteClient(id, applicationSlug);
  }
}
