import {
  BadRequestException,
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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Prisma } from '@prisma/client';
import { PROPERTY_PORT, type PropertyPort } from '@application/ports';
import { CreatePropertyDto, UpdatePropertyDto } from '../dtos/properties';
import { UpdateListingStatusDto } from '../dtos/properties/update-listing-status.dto';
import { PrismaService } from '../../database/prisma/prisma.service';
import { GenArchivoService } from '../../../application/services/gen-archivo.service';
import type { UploadedFile as MulterUploadedFile } from '../../../common/types';
import type { PropertyMediaItem } from '@domain/entities/property.entity';

@ApiTags('Properties')
@Controller('properties')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PropertiesController {
  constructor(
    @Inject(PROPERTY_PORT) private readonly properties: PropertyPort,
    private readonly prisma: PrismaService,
    private readonly genArchivo: GenArchivoService,
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
    return this.properties.listProperties({
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
    return this.properties.getPropertyStats(applicationSlug ?? 'alquileres');
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

  @Get('currencies')
  @ApiOperation({ summary: 'Listar monedas activas (precio de venta, etc.)' })
  @ApiResponse({ status: 200 })
  async getCurrencies() {
    return this.prisma.currency.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, code: true, name: true, symbol: true },
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
      take: 500,
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
    return this.properties.getPropertyById(id, applicationSlug);
  }

  @Post(':id/media')
  @ApiOperation({ summary: 'Subir foto/plano a MinIO y agregarlo a mediaItems' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
        kind: { type: 'string', enum: ['photo', 'plan'] },
      },
    },
  })
  @ApiParam({ name: 'id', description: 'UUID de la propiedad' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(
    @Param('id') id: string,
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: { kind?: string },
    @UploadedFile() file?: MulterUploadedFile,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Archivo requerido');
    }
    const kind = body.kind === 'plan' ? 'plan' : 'photo';
    const property = await this.properties.getPropertyById(id, applicationSlug);
    const app = await this.prisma.application.findFirst({
      where: { id: property.applicationId, deletedAt: null },
      select: { slug: true },
    });
    const slug = applicationSlug?.trim() || app?.slug || 'alquileres';

    const archivo = await this.genArchivo.upload(
      {
        applicationSlug: slug,
        module: 'properties',
        entityType: 'property',
        entityId: id,
        category: kind,
      },
      file,
    );

    const existing: PropertyMediaItem[] = [...(property.mediaItems ?? [])];
    const item: PropertyMediaItem = {
      url: archivo.objectKey,
      kind,
      archivoId: archivo.id,
    };
    existing.push(item);

    const updated = await this.properties.updateProperty(
      { id, mediaItems: existing },
      applicationSlug,
    );

    const downloadUrl = await this.genArchivo.resolveDownloadUrl(
      archivo.id,
      archivo.objectKey,
    );

    return {
      mediaItem: item,
      downloadUrl,
      mediaItems: updated.mediaItems,
      property: updated,
    };
  }

  @Delete(':id/media')
  @ApiOperation({ summary: 'Quitar un ítem de mediaItems por url (y opcionalmente archivoId)' })
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async removeMedia(
    @Param('id') id: string,
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: { url: string; archivoId?: string },
  ) {
    if (!body?.url?.trim()) {
      throw new BadRequestException('url es obligatorio');
    }
    const property = await this.properties.getPropertyById(id, applicationSlug);
    const next = (property.mediaItems ?? []).filter((m) => {
      if (body.archivoId && m.archivoId) {
        return m.archivoId !== body.archivoId;
      }
      return m.url !== body.url.trim();
    });
    const updated = await this.properties.updateProperty(
      {
        id,
        mediaItems: next.length ? next : null,
      },
      applicationSlug,
    );
    return updated;
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
    return this.properties.updateListingStatus(
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
    return this.properties.updateProperty(
      {
        id,
        code: dto.code,
        propertyTypeId: dto.propertyTypeId,
        addressLine: dto.addressLine,
        districtId: dto.districtId,
        locationCustom: dto.locationCustom,
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
        ownerClientIds: dto.ownerClientIds,
        monthlyRent: dto.monthlyRent,
        maintenanceAmount: dto.maintenanceAmount,
        depositMonths: dto.depositMonths,
        salePrice: dto.salePrice,
        saleCurrency: dto.saleCurrency,
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
    return this.properties.createProperty({
      applicationId: dto.applicationId,
      applicationSlug: dto.applicationSlug ?? 'alquileres',
      code: dto.code,
      propertyTypeId: dto.propertyTypeId,
      addressLine: dto.addressLine,
      districtId: dto.districtId,
      locationCustom: dto.locationCustom,
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
      ownerClientIds: dto.ownerClientIds,
      monthlyRent: dto.monthlyRent,
      maintenanceAmount: dto.maintenanceAmount,
      depositMonths: dto.depositMonths,
      salePrice: dto.salePrice,
      saleCurrency: dto.saleCurrency,
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
    return this.properties.deleteProperty(id, applicationSlug);
  }
}
