import { Controller, Get, Post, Patch, Delete, Body, Query, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Prisma } from '@prisma/client';
import {
  CreatePropertyUseCase,
  GetPropertyByIdUseCase,
  ListPropertiesUseCase,
  GetPropertyStatsUseCase,
  UpdatePropertyUseCase,
  UpdatePropertyListingStatusUseCase,
  DeletePropertyUseCase,
} from '../../../application/use-cases/properties';
import { CreatePropertyDto, UpdatePropertyDto } from '../dtos/properties';
import { UpdateListingStatusDto } from '../dtos/properties/update-listing-status.dto';
import { PrismaService } from '../../database/prisma/prisma.service';

@ApiTags('Properties')
@Controller('properties')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PropertiesController {
  constructor(
    private readonly createPropertyUseCase: CreatePropertyUseCase,
    private readonly getPropertyByIdUseCase: GetPropertyByIdUseCase,
    private readonly listPropertiesUseCase: ListPropertiesUseCase,
    private readonly getPropertyStatsUseCase: GetPropertyStatsUseCase,
    private readonly updatePropertyUseCase: UpdatePropertyUseCase,
    private readonly updatePropertyListingStatusUseCase: UpdatePropertyListingStatusUseCase,
    private readonly deletePropertyUseCase: DeletePropertyUseCase,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar propiedades (paginado)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'propertyTypeId', required: false })
  @ApiQuery({ name: 'districtId', required: false })
  @ApiQuery({ name: 'listingStatus', required: false })
  @ApiQuery({ name: 'minSalePrice', required: false })
  @ApiQuery({ name: 'maxSalePrice', required: false })
  @ApiResponse({ status: 200 })
  async list(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('propertyTypeId') propertyTypeId?: string,
    @Query('districtId') districtId?: string,
    @Query('listingStatus') listingStatus?: string,
    @Query('minSalePrice') minSalePrice?: string,
    @Query('maxSalePrice') maxSalePrice?: string,
  ) {
    const parseOptPrice = (v?: string) => {
      if (v === undefined || v === '') return undefined;
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    };
    return this.listPropertiesUseCase.execute({
      applicationSlug: applicationSlug ?? 'alquileres',
      page: Math.max(1, parseInt(page ?? '1', 10)),
      limit: Math.min(50, Math.max(1, parseInt(limit ?? '10', 10))),
      search: search?.trim() || undefined,
      propertyTypeId: propertyTypeId || undefined,
      districtId: districtId || undefined,
      listingStatus: listingStatus === '' ? undefined : listingStatus ?? undefined,
      minSalePrice: parseOptPrice(minSalePrice),
      maxSalePrice: parseOptPrice(maxSalePrice),
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estadísticas de propiedades' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiResponse({ status: 200 })
  async stats(@Query('applicationSlug') applicationSlug?: string) {
    return this.getPropertyStatsUseCase.execute(applicationSlug ?? 'alquileres');
  }

  @Get('property-types')
  @ApiOperation({ summary: 'Listar tipos de propiedad' })
  @ApiResponse({ status: 200 })
  async getPropertyTypes() {
    return (this.prisma as any).propertyType.findMany({
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

  @Get('owners')
  @ApiOperation({ summary: 'Listar propietarios (clientes tipo OWNER)' })
  @ApiQuery({ name: 'applicationSlug', required: false, description: 'Slug de la aplicación (default: alquileres)' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nombre o documento' })
  @ApiResponse({ status: 200 })
  async getOwners(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('search') search?: string,
  ) {
    const slug = applicationSlug ?? 'alquileres';
    const app = await this.prisma.application.findUnique({
      where: { slug },
    });
    if (!app) return [];

    const where: Prisma.ClientWhereInput = {
      applicationId: app.id,
      clientType: 'OWNER',
      deletedAt: null,
    };
    if (search?.trim()) {
      const q = search.trim();
      where.OR = [
        { fullName: { contains: q } },
        { documentNumber: { contains: q } },
      ];
    }

    return this.prisma.client.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        documentNumber: true,
        primaryPhone: true,
        primaryEmail: true,
      },
      orderBy: { fullName: 'asc' },
      take: 100,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener propiedad por ID' })
  @ApiParam({ name: 'id', description: 'UUID de la propiedad' })
  @ApiQuery({
    name: 'applicationSlug',
    required: false,
    description: 'Si se indica (ej. ventas), solo se devuelve si la propiedad pertenece a esa aplicación',
  })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404 })
  async getById(
    @Param('id') id: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.getPropertyByIdUseCase.execute(id, applicationSlug);
  }

  @Patch(':id/listing-status')
  @ApiOperation({
    summary:
      'Cambiar estado de listado (Ventas: sin restricción; Alquileres: requiere alquiler activo para RENTED/EXPIRING/MAINTENANCE)',
  })
  @ApiParam({ name: 'id', description: 'UUID de la propiedad' })
  @ApiQuery({
    name: 'applicationSlug',
    required: false,
    description: 'Si se indica, la propiedad debe pertenecer a esa aplicación',
  })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 400, description: 'Validación de aplicación o alquiler' })
  @ApiResponse({ status: 404 })
  async updateListingStatus(
    @Param('id') id: string,
    @Body() dto: UpdateListingStatusDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.updatePropertyListingStatusUseCase.execute(
      id,
      dto.listingStatus,
      applicationSlug,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar propiedad' })
  @ApiParam({ name: 'id', description: 'UUID de la propiedad' })
  @ApiQuery({
    name: 'applicationSlug',
    required: false,
    description: 'Si se indica, la propiedad debe pertenecer a esa aplicación',
  })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404 })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePropertyDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.updatePropertyUseCase.execute(
      {
        id,
        code: dto.code,
        propertyTypeId: dto.propertyTypeId,
        addressLine: dto.addressLine,
        districtId: dto.districtId,
        description: dto.description,
        area: dto.area,
        bedrooms: dto.bedrooms,
        bathrooms: dto.bathrooms,
        ageYears: dto.ageYears,
        floorLevel: dto.floorLevel,
        parkingSpaces: dto.parkingSpaces,
        partida1: dto.partida1,
        partida2: dto.partida2,
        partida3: dto.partida3,
        ownerId: dto.ownerId,
        monthlyRent: dto.monthlyRent,
        maintenanceAmount: dto.maintenanceAmount,
        depositMonths: dto.depositMonths,
        salePrice: dto.salePrice,
        projectName: dto.projectName,
        mediaItems: dto.mediaItems,
        listingStatus: dto.listingStatus,
      },
      applicationSlug,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Crear propiedad' })
  @ApiResponse({ status: 201 })
  async create(@Body() dto: CreatePropertyDto) {
    return this.createPropertyUseCase.execute({
      applicationId: dto.applicationId,
      applicationSlug: dto.applicationSlug ?? 'alquileres',
      code: dto.code,
      propertyTypeId: dto.propertyTypeId,
      addressLine: dto.addressLine,
      districtId: dto.districtId,
      description: dto.description,
      area: dto.area,
      bedrooms: dto.bedrooms,
      bathrooms: dto.bathrooms,
      ageYears: dto.ageYears,
      floorLevel: dto.floorLevel,
      parkingSpaces: dto.parkingSpaces,
      partida1: dto.partida1,
      partida2: dto.partida2,
      partida3: dto.partida3,
      ownerId: dto.ownerId,
      monthlyRent: dto.monthlyRent,
      maintenanceAmount: dto.maintenanceAmount,
      depositMonths: dto.depositMonths,
      salePrice: dto.salePrice,
      projectName: dto.projectName,
      mediaItems: dto.mediaItems,
      listingStatus: dto.listingStatus,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar propiedad (soft delete)' })
  @ApiQuery({
    name: 'applicationSlug',
    required: false,
    description: 'Si se indica, la propiedad debe pertenecer a esa aplicación',
  })
  @ApiResponse({ status: 200, description: 'Propiedad eliminada correctamente' })
  @ApiResponse({ status: 404 })
  async remove(
    @Param('id') id: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.deletePropertyUseCase.execute(id, applicationSlug);
  }
}
