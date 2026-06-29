import { Body, Controller, Get, Param, Post, Put, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ContabilidadSolOperationsService } from '../../../application/services/contabilidad-sol-operations.service';
import type { UpsertSolCredentialsInput } from '@domain/repositories/contabilidad-sol.repository';

@ApiTags('Contabilidad — Declaraciones SUNAT (SOL)')
@Controller('contabilidad-sol')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ContabilidadSolController {
  constructor(private readonly sol: ContabilidadSolOperationsService) {}

  @Get('credentials')
  @ApiOperation({ summary: 'Credenciales SOL por entidad legal' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'legalEntityId', required: false })
  getCredentials(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('legalEntityId') legalEntityId?: string,
  ) {
    return this.sol.getCredentials(applicationSlug, legalEntityId);
  }

  @Put('credentials')
  @ApiOperation({ summary: 'Guardar credenciales SOL (clave enmascarada)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'legalEntityId', required: false })
  saveCredentials(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('legalEntityId') legalEntityId?: string,
    @Body() body?: UpsertSolCredentialsInput,
  ) {
    return this.sol.saveCredentials(applicationSlug, legalEntityId, body ?? { solUser: '' });
  }

  @Get('declarations')
  @ApiOperation({ summary: 'Historial de declaraciones SUNAT' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'legalEntityId', required: false })
  listDeclarations(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('legalEntityId') legalEntityId?: string,
    @Query('periodId') periodId?: string,
    @Query('declarationType') declarationType?: string,
  ) {
    return this.sol.listDeclarations(applicationSlug, legalEntityId, periodId, declarationType);
  }

  @Post('pdt621/prepare')
  @ApiOperation({ summary: 'Preparar paquete PDT 621 del periodo' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'legalEntityId', required: false })
  preparePdt621(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('legalEntityId') legalEntityId?: string,
    @Query('periodId') periodId?: string,
    @Req() req?: Request & { user?: { sub?: string } },
  ) {
    return this.sol.preparePdt621(applicationSlug, legalEntityId, periodId ?? '', req?.user?.sub ?? null);
  }

  @Post('pdt621/:logId/manual-pending')
  @ApiOperation({ summary: 'Marcar PDT 621 pendiente de carga manual en SOL' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'legalEntityId', required: false })
  @ApiQuery({ name: 'periodId', required: true })
  markManualPending(
    @Param('logId') logId: string,
    @Query('applicationSlug') applicationSlug?: string,
    @Query('legalEntityId') legalEntityId?: string,
    @Query('periodId') periodId?: string,
  ) {
    return this.sol.markPdt621ManualPending(applicationSlug, legalEntityId, periodId ?? '', logId);
  }

  @Post('pdt621/:logId/submit')
  @ApiOperation({ summary: 'Enviar PDT 621 (sandbox MOCK o error si producción)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'legalEntityId', required: false })
  @ApiQuery({ name: 'periodId', required: true })
  submitPdt621(
    @Param('logId') logId: string,
    @Query('applicationSlug') applicationSlug?: string,
    @Query('legalEntityId') legalEntityId?: string,
    @Query('periodId') periodId?: string,
    @Req() req?: Request & { user?: { sub?: string } },
  ) {
    return this.sol.submitPdt621(
      applicationSlug,
      legalEntityId,
      periodId ?? '',
      logId,
      req?.user?.sub ?? null,
    );
  }

  @Post('plame/prepare')
  @ApiOperation({ summary: 'Borrador estructural PLAME del periodo' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'legalEntityId', required: false })
  preparePlame(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('legalEntityId') legalEntityId?: string,
    @Query('periodId') periodId?: string,
    @Req() req?: Request & { user?: { sub?: string } },
  ) {
    return this.sol.preparePlameDraft(applicationSlug, legalEntityId, periodId ?? '', req?.user?.sub ?? null);
  }

  @Get('declarations/:logId/package')
  @ApiOperation({ summary: 'Descargar paquete JSON de declaración' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async downloadPackage(
    @Param('logId') logId: string,
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Res() res: Response,
  ) {
    const artifact = await this.sol.downloadPackage(applicationSlug, logId);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${artifact.filename}"`);
    res.send(artifact.content);
  }
}
