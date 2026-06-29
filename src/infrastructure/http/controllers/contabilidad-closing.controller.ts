import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ContabilidadClosingOperationsService } from '../../../application/services/contabilidad-closing-operations.service';

@ApiTags('Contabilidad — Cierre mensual')
@Controller('contabilidad-closing')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ContabilidadClosingController {
  constructor(private readonly closing: ContabilidadClosingOperationsService) {}

  @Get(':periodId/preview')
  @ApiOperation({ summary: 'Checklist y vista previa antes del cierre' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  getPreview(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Param('periodId') periodId: string,
  ) {
    return this.closing.getClosingPreview(applicationSlug, periodId);
  }

  @Post(':periodId/close')
  @ApiOperation({ summary: 'Cerrar periodo contable tras validar checklist' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  closePeriod(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Param('periodId') periodId: string,
  ) {
    return this.closing.closePeriod(applicationSlug, periodId);
  }
}
