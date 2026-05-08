import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
  CreateInteriorMaterialSupplierUseCase,
  DeleteInteriorMaterialSupplierUseCase,
  GetInteriorMaterialSupplierByIdUseCase,
  LinkInteriorSupplierCatalogMaterialUseCase,
  ListInteriorMaterialSuppliersUseCase,
  RecordInteriorMaterialPurchaseUseCase,
  UnlinkInteriorSupplierCatalogMaterialUseCase,
  UpdateInteriorMaterialSupplierUseCase,
} from '../../../application/use-cases/interior-material-suppliers';
import { CreateInteriorMaterialSupplierDto } from '../dtos/interiorismo-material-suppliers/create-material-supplier.dto';
import { LinkSupplierCatalogMaterialDto } from '../dtos/interiorismo-material-suppliers/link-supplier-catalog.dto';
import { RecordInteriorMaterialPurchaseDto } from '../dtos/interiorismo-material-suppliers/record-material-purchase.dto';
import { UpdateInteriorMaterialSupplierDto } from '../dtos/interiorismo-material-suppliers/update-material-supplier.dto';

@ApiTags('Interiorismo — Materiales (proveedores)')
@Controller('interiorismo-material-suppliers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class InteriorismoMaterialSuppliersController {
  constructor(
    private readonly listUc: ListInteriorMaterialSuppliersUseCase,
    private readonly getByIdUc: GetInteriorMaterialSupplierByIdUseCase,
    private readonly createUc: CreateInteriorMaterialSupplierUseCase,
    private readonly updateUc: UpdateInteriorMaterialSupplierUseCase,
    private readonly deleteUc: DeleteInteriorMaterialSupplierUseCase,
    private readonly linkUc: LinkInteriorSupplierCatalogMaterialUseCase,
    private readonly unlinkUc: UnlinkInteriorSupplierCatalogMaterialUseCase,
    private readonly purchaseUc: RecordInteriorMaterialPurchaseUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar proveedores' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  async list(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.listUc.execute({
      applicationSlug: applicationSlug ?? 'interiorismo',
      page: Math.max(1, parseInt(page ?? '1', 10)),
      limit: Math.min(100, Math.max(1, parseInt(limit ?? '20', 10))),
      search: search?.trim() || undefined,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Crear proveedor' })
  async create(
    @Body() dto: CreateInteriorMaterialSupplierDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.createUc.execute(applicationSlug ?? 'interiorismo', {
      companyName: dto.companyName,
      ruc: dto.ruc,
      contactName: dto.contactName ?? null,
      phone: dto.phone ?? null,
      email: dto.email ?? null,
    });
  }

  @Delete('catalog-links/:linkId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Quitar material del proveedor' })
  @ApiResponse({ status: 204 })
  async unlinkCatalog(
    @Param('linkId') linkId: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    await this.unlinkUc.execute(linkId, applicationSlug ?? 'interiorismo');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle proveedor (materiales vinculados + historial compras)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async getById(
    @Param('id') id: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.getByIdUc.execute(id, applicationSlug ?? 'interiorismo');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar proveedor' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateInteriorMaterialSupplierDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.updateUc.execute(id, applicationSlug ?? 'interiorismo', dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar proveedor' })
  @ApiResponse({ status: 204 })
  async delete(
    @Param('id') id: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    await this.deleteUc.execute(id, applicationSlug ?? 'interiorismo');
  }

  @Post(':id/catalog-links')
  @ApiOperation({ summary: 'Vincular material del catálogo' })
  async linkCatalog(
    @Param('id') supplierId: string,
    @Body() dto: LinkSupplierCatalogMaterialDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.linkUc.execute(
      supplierId,
      applicationSlug ?? 'interiorismo',
      dto.catalogMaterialId,
      dto.supplierSku ?? null,
      dto.notes ?? null,
    );
  }

  @Post(':id/purchases')
  @ApiOperation({ summary: 'Registrar compra / historial' })
  async recordPurchase(
    @Param('id') supplierId: string,
    @Body() dto: RecordInteriorMaterialPurchaseDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    const purchasedAt = new Date(dto.purchasedAt);
    if (Number.isNaN(purchasedAt.getTime())) {
      throw new BadRequestException('Fecha de compra inválida');
    }
    return this.purchaseUc.execute(supplierId, applicationSlug ?? 'interiorismo', {
      catalogMaterialId: dto.catalogMaterialId ?? null,
      purchasedAt,
      quantity: dto.quantity,
      unitPrice: dto.unitPrice,
      invoiceRef: dto.invoiceRef ?? null,
      notes: dto.notes ?? null,
    });
  }
}
