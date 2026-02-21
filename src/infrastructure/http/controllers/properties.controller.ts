import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Prisma } from '@prisma/client';
import {
  CreatePropertyUseCase,
  ListPropertiesUseCase,
  GetPropertyStatsUseCase,
} from '../../../application/use-cases/properties';
import { CreatePropertyDto } from '../dtos/properties';
import { PrismaService } from '../../database/prisma/prisma.service';

@ApiTags('Properties')
@Controller('properties')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PropertiesController {
  constructor(
    private readonly createPropertyUseCase: CreatePropertyUseCase,
    private readonly listPropertiesUseCase: ListPropertiesUseCase,
    private readonly getPropertyStatsUseCase: GetPropertyStatsUseCase,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar propiedades (paginado)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'propertyTypeId', required: false })
  @ApiQuery({ name: 'listingStatus', required: false })
  @ApiResponse({ status: 200 })
  async list(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('propertyTypeId') propertyTypeId?: string,
    @Query('listingStatus') listingStatus?: string,
  ) {
    return this.listPropertiesUseCase.execute({
      applicationSlug: applicationSlug ?? 'alquileres',
      page: Math.max(1, parseInt(page ?? '1', 10)),
      limit: Math.min(50, Math.max(1, parseInt(limit ?? '10', 10))),
      search: search?.trim() || undefined,
      propertyTypeId: propertyTypeId || undefined,
      listingStatus: listingStatus === '' ? undefined : listingStatus ?? undefined,
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
        { fullName: { contains: q, mode: 'insensitive' } },
        { documentNumber: { contains: q, mode: 'insensitive' } },
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
    });
  }
}
