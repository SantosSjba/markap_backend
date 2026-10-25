import { CatalogQueriesService } from '../../../../shared/application/services/catalog-queries.service';
import { parseIntegerQuery } from '../../../../shared/utils/parse-integer-query.util';
import { PropertyLookupsService } from '../../application/services/property-lookups.service';
import { UploadPropertyMediaUseCase } from '../../application/use-cases/properties/upload-property-media.use-case';

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
import { FileInterceptor } from '@nestjs/platform-express';
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

import { FileStoragePort } from '../../../../shared/application/ports/file-storage.port';
import {
  PropertyMediaDeleteDto,
  PropertyMediaUploadDto,
} from '../../../../shared/presentation/dtos/uploads/upload-requests.dto';
import { JwtAuthGuard } from '../../../../shared/presentation/guards/jwt-auth.guard';
import type { UploadedFile as MulterUploadedFile } from '../../../../shared/types/uploaded-file.types';
import {
  PROPERTY_PORT,
  type PropertyPort,
} from '../../application/ports/property.port';
import { CreatePropertyDto } from '../dtos/properties/create-property.dto';
import { UpdateListingStatusDto } from '../dtos/properties/update-listing-status.dto';
import { UpdatePropertyDto } from '../dtos/properties/update-property.dto';

@ApiTags('Properties')
@Controller('properties')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PropertiesController {
  constructor(
    @Inject(PROPERTY_PORT) private readonly properties: PropertyPort,
    private readonly catalogs: CatalogQueriesService,
    private readonly lookups: PropertyLookupsService,
    private readonly uploadPropertyMedia: UploadPropertyMediaUseCase,
    private readonly genArchivo: FileStoragePort,
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
      page: Math.max(1, parseIntegerQuery(page, 1, 1, 1000000)),
      limit: Math.min(50, Math.max(1, parseIntegerQuery(limit, 10, 1, 100))),
      search: search?.trim() || undefined,
      propertyTypeId: propertyTypeId || undefined,
      districtId: districtId || undefined,
      listingStatus:
        listingStatus === '' ? undefined : (listingStatus ?? undefined),
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
    return this.catalogs.propertyTypes();
  }

  @Get('currencies')
  @ApiOperation({ summary: 'Listar monedas activas (precio de venta, etc.)' })
  @ApiResponse({ status: 200 })
  async getCurrencies() {
    return this.catalogs.currencies();
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

  @Get('owners')
  @ApiOperation({ summary: 'Listar propietarios (clientes tipo OWNER)' })
  @ApiQuery({
    name: 'applicationSlug',
    required: false,
    description: 'Slug de la aplicación (default: alquileres)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Buscar por nombre o documento',
  })
  @ApiResponse({ status: 200 })
  async getOwners(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('search') search?: string,
  ) {
    return this.lookups.owners(applicationSlug, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener propiedad por ID' })
  @ApiParam({ name: 'id', description: 'UUID de la propiedad' })
  @ApiQuery({
    name: 'applicationSlug',
    required: false,
    description:
      'Si se indica (ej. ventas), solo se devuelve si la propiedad pertenece a esa aplicación',
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
  @ApiOperation({
    summary: 'Subir foto/plano a MinIO y agregarlo a mediaItems',
  })
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
    @Body() body: PropertyMediaUploadDto,
    @UploadedFile() file?: MulterUploadedFile,
  ) {
    return this.uploadPropertyMedia.execute(
      id,
      applicationSlug,
      body.kind,
      file,
    );
  }

  @Delete(':id/media')
  @ApiOperation({
    summary: 'Quitar un ítem de mediaItems por url (y opcionalmente archivoId)',
  })
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async removeMedia(
    @Param('id') id: string,
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: PropertyMediaDeleteDto,
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
  @ApiResponse({
    status: 400,
    description: 'Validación de aplicación o alquiler',
  })
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
  @ApiResponse({
    status: 200,
    description: 'Propiedad eliminada correctamente',
  })
  @ApiResponse({ status: 404 })
  async remove(
    @Param('id') id: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.properties.deleteProperty(id, applicationSlug);
  }
}
