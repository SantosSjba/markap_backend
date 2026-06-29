import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, type AuthenticatedRequest } from '../../../common/guards/jwt-auth.guard';
import { ContabilidadAccountOperationsService } from '../../../application/services/contabilidad-account-operations.service';
import type {
  CreateContabilidadAccountInput,
  UpdateContabilidadAccountInput,
} from '@domain/repositories/contabilidad-account.repository';

@ApiTags('Contabilidad — Plan de cuentas')
@Controller('contabilidad-accounts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ContabilidadAccountsController {
  constructor(private readonly accounts: ContabilidadAccountOperationsService) {}

  @Get('tree')
  @ApiOperation({ summary: 'Plan de cuentas PCGE en árbol (con seed automático)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'search', required: false })
  listTree(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('search') search?: string,
  ) {
    return this.accounts.listTree(applicationSlug, search);
  }

  @Get('pcge-classes')
  @ApiOperation({ summary: 'Clases PCGE disponibles para importación' })
  getPcgeClasses() {
    return this.accounts.getPcgeCatalogMeta();
  }

  @Post('import-pcge')
  @ApiOperation({ summary: 'Importar cuentas PCGE por clase (merge idempotente)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'classes', required: false, description: 'Clases separadas por coma, ej. 1,2,3' })
  importPcge(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Query('classes') classes?: string,
  ) {
    return this.accounts.importPcge(applicationSlug, classes);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener cuenta por ID' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  getById(@Query('applicationSlug') applicationSlug: string | undefined, @Param('id') id: string) {
    return this.accounts.getById(applicationSlug, id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear cuenta bajo una cuenta título' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  create(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: CreateContabilidadAccountInput,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.accounts.create(applicationSlug, body, req?.user?.sub ?? null);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar cuenta' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  update(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Param('id') id: string,
    @Body() body: UpdateContabilidadAccountInput,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.accounts.update(applicationSlug, id, body, req?.user?.sub ?? null);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Desactivar cuenta (sin eliminar)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  deactivate(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.accounts.deactivate(applicationSlug, id, req?.user?.sub ?? null);
  }
}
