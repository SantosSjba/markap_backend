import { RequiresApplication } from '../../../../shared/presentation/decorators/application-access.decorators';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CatalogQueriesService } from '../../../../shared/application/services/catalog-queries.service';

import { JwtAuthGuard } from '../../../../shared/presentation/guards/jwt-auth.guard';
import { parseIntegerQuery } from '../../../../shared/utils/parse-integer-query.util';
import {
  CLIENT_PORT,
  type ClientPort,
} from '../../application/ports/client.port';
import { CreateClientDto } from '../dtos/clients/create-client.dto';
import { UpdateClientDto } from '../dtos/clients/update-client.dto';

@ApiTags('Clients')
@RequiresApplication({ fromRequest: true, fallback: ['alquileres', 'ventas'] })
@Controller('clients')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ClientsController {
  constructor(
    @Inject(CLIENT_PORT) private readonly clients: ClientPort,
    private readonly catalogs: CatalogQueriesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar clientes (paginado)' })
  @ApiQuery({
    name: 'applicationSlug',
    required: false,
    description: 'Slug de la aplicación (default: alquileres)',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Página (1-based)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items por página' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Buscar por nombre, documento o email',
  })
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
  @ApiQuery({
    name: 'isActive',
    required: false,
    description: 'Filtrar por estado activo (true/false)',
  })
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
      page: Math.max(1, parseIntegerQuery(page, 1, 1, 1000000)),
      limit: Math.min(50, Math.max(1, parseIntegerQuery(limit, 10, 1, 100))),
      search: search?.trim() || undefined,
      clientType,
      salesStatus,
      isActive:
        isActive === 'true' ? true : isActive === 'false' ? false : undefined,
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
    return this.catalogs.documentTypes();
  }

  @Get('departments')
  @ApiOperation({ summary: 'Listar departamentos del Perú' })
  @ApiResponse({ status: 200 })
  async getDepartments() {
    return this.catalogs.departments();
  }

  @Get('provinces')
  @ApiOperation({ summary: 'Listar provincias por departamento' })
  @ApiQuery({ name: 'departmentId', required: false })
  @ApiResponse({ status: 200 })
  async getProvinces(@Query('departmentId') departmentId?: string) {
    return this.catalogs.provinces(departmentId);
  }

  @Get('districts')
  @ApiOperation({ summary: 'Listar distritos por provincia' })
  @ApiQuery({ name: 'provinceId', required: false })
  @ApiResponse({ status: 200 })
  async getDistricts(@Query('provinceId') provinceId?: string) {
    return this.catalogs.districts(provinceId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener cliente por ID' })
  @ApiQuery({
    name: 'applicationSlug',
    required: false,
    description:
      'Si se indica (ej. ventas), solo se devuelve si el cliente pertenece a esa aplicación',
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
