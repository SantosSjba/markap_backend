import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ContabilidadClosingOperationsService } from '../../../application/services/contabilidad-closing-operations.service';

interface ClosePeriodBody {
  postRegularization?: boolean;
}

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
    @Body() body: ClosePeriodBody,
    @Req() req: Request & { user?: { sub?: string } },
  ) {
    return this.closing.closePeriod(applicationSlug, periodId, {
      postRegularization: body?.postRegularization,
      userId: req.user?.sub ?? null,
    });
  }
}
