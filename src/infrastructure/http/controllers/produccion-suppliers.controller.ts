import {
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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
  CreateProduccionSupplierUseCase,
  DeleteProduccionSupplierUseCase,
  GetProduccionSupplierByIdUseCase,
  LinkProduccionSupplierMaterialUseCase,
  ListProduccionSuppliersUseCase,
  UnlinkProduccionSupplierMaterialUseCase,
  UpdateProduccionSupplierUseCase,
} from '../../../application/use-cases/produccion-suppliers';
import {
  CreateProduccionSupplierDto,
  LinkProduccionSupplierMaterialDto,
  UpdateProduccionSupplierDto,
} from '../dtos/produccion-purchases/supplier.dto';

@ApiTags('Producción — Compras (proveedores)')
@Controller('produccion-suppliers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ProduccionSuppliersController {
  constructor(
    private readonly listUc: ListProduccionSuppliersUseCase,
    private readonly getByIdUc: GetProduccionSupplierByIdUseCase,
    private readonly createUc: CreateProduccionSupplierUseCase,
    private readonly updateUc: UpdateProduccionSupplierUseCase,
    private readonly deleteUc: DeleteProduccionSupplierUseCase,
    private readonly linkUc: LinkProduccionSupplierMaterialUseCase,
    private readonly unlinkUc: UnlinkProduccionSupplierMaterialUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar proveedores' })
  list(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ) {
    let activeFilter: boolean | undefined;
    if (isActive === 'true') activeFilter = true;
    if (isActive === 'false') activeFilter = false;

    return this.listUc.execute({
      applicationSlug: applicationSlug ?? 'produccion',
      page: Math.max(1, parseInt(page ?? '1', 10)),
      limit: Math.min(100, Math.max(1, parseInt(limit ?? '20', 10))),
      search: search?.trim() || undefined,
      isActive: activeFilter,
    });
  }

  @Post()
  create(
    @Body() dto: CreateProduccionSupplierDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.createUc.execute(applicationSlug ?? 'produccion', dto);
  }

  @Get(':id')
  getById(@Param('id') id: string, @Query('applicationSlug') applicationSlug?: string) {
    return this.getByIdUc.execute(id, applicationSlug ?? 'produccion');
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProduccionSupplierDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.updateUc.execute(id, applicationSlug ?? 'produccion', dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 204 })
  delete(@Param('id') id: string, @Query('applicationSlug') applicationSlug?: string) {
    return this.deleteUc.execute(id, applicationSlug ?? 'produccion');
  }

  @Post(':id/material-links')
  @ApiOperation({ summary: 'Vincular material al proveedor' })
  linkMaterial(
    @Param('id') id: string,
    @Body() dto: LinkProduccionSupplierMaterialDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.linkUc.execute(
      id,
      applicationSlug ?? 'produccion',
      dto.materialId,
      dto.supplierSku,
      dto.notes,
    );
  }

  @Delete('material-links/:linkId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 204 })
  unlinkMaterial(
    @Param('linkId') linkId: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.unlinkUc.execute(linkId, applicationSlug ?? 'produccion');
  }
}
