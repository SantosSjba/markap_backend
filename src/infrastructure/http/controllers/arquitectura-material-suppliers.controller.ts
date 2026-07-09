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
  CreateArquitecturaMaterialSupplierUseCase,
  DeleteArquitecturaMaterialSupplierUseCase,
  GetArquitecturaMaterialSupplierByIdUseCase,
  LinkArquitecturaSupplierCatalogMaterialUseCase,
  ListArquitecturaMaterialSuppliersUseCase,
  RecordArquitecturaMaterialPurchaseUseCase,
  UnlinkArquitecturaSupplierCatalogMaterialUseCase,
  UpdateArquitecturaMaterialSupplierUseCase,
} from '../../../application/use-cases/arquitectura-material-suppliers';
import { CreateArquitecturaMaterialSupplierDto } from '../dtos/arquitectura-material-suppliers/create-material-supplier.dto';
import { LinkSupplierCatalogMaterialDto } from '../dtos/arquitectura-material-suppliers/link-supplier-catalog.dto';
import { RecordArquitecturaMaterialPurchaseDto } from '../dtos/arquitectura-material-suppliers/record-material-purchase.dto';
import { UpdateArquitecturaMaterialSupplierDto } from '../dtos/arquitectura-material-suppliers/update-material-supplier.dto';

@ApiTags('Arquitectura — Materiales (proveedores)')
@Controller('arquitectura-material-suppliers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ArquitecturaMaterialSuppliersController {
  constructor(
    private readonly listUc: ListArquitecturaMaterialSuppliersUseCase,
    private readonly getByIdUc: GetArquitecturaMaterialSupplierByIdUseCase,
    private readonly createUc: CreateArquitecturaMaterialSupplierUseCase,
    private readonly updateUc: UpdateArquitecturaMaterialSupplierUseCase,
    private readonly deleteUc: DeleteArquitecturaMaterialSupplierUseCase,
    private readonly linkUc: LinkArquitecturaSupplierCatalogMaterialUseCase,
    private readonly unlinkUc: UnlinkArquitecturaSupplierCatalogMaterialUseCase,
    private readonly purchaseUc: RecordArquitecturaMaterialPurchaseUseCase,
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
      applicationSlug: applicationSlug ?? 'arquitectura',
      page: Math.max(1, parseInt(page ?? '1', 10)),
      limit: Math.min(100, Math.max(1, parseInt(limit ?? '20', 10))),
      search: search?.trim() || undefined,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Crear proveedor' })
  async create(
    @Body() dto: CreateArquitecturaMaterialSupplierDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.createUc.execute(applicationSlug ?? 'arquitectura', {
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
    await this.unlinkUc.execute(linkId, applicationSlug ?? 'arquitectura');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle proveedor (materiales vinculados + historial compras)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async getById(
    @Param('id') id: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.getByIdUc.execute(id, applicationSlug ?? 'arquitectura');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar proveedor' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateArquitecturaMaterialSupplierDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.updateUc.execute(id, applicationSlug ?? 'arquitectura', dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar proveedor' })
  @ApiResponse({ status: 204 })
  async delete(
    @Param('id') id: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    await this.deleteUc.execute(id, applicationSlug ?? 'arquitectura');
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
      applicationSlug ?? 'arquitectura',
      dto.catalogMaterialId,
      dto.supplierSku ?? null,
      dto.notes ?? null,
    );
  }

  @Post(':id/purchases')
  @ApiOperation({ summary: 'Registrar compra / historial' })
  async recordPurchase(
    @Param('id') supplierId: string,
    @Body() dto: RecordArquitecturaMaterialPurchaseDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    const purchasedAt = new Date(dto.purchasedAt);
    if (Number.isNaN(purchasedAt.getTime())) {
      throw new BadRequestException('Fecha de compra inválida');
    }
    return this.purchaseUc.execute(supplierId, applicationSlug ?? 'arquitectura', {
      catalogMaterialId: dto.catalogMaterialId ?? null,
      purchasedAt,
      quantity: dto.quantity,
      unitPrice: dto.unitPrice,
      invoiceRef: dto.invoiceRef ?? null,
      notes: dto.notes ?? null,
    });
  }
}
