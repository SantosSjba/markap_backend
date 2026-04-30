import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { VentasComplianceOperationsService } from '../../../application/services/ventas-compliance-operations.service';
import { FileInterceptor } from '@nestjs/platform-express';
import type { UploadedFile as MulterUploadedFile } from '../../../common/types';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

@ApiTags('Ventas — Cumplimiento Legal')
@Controller('ventas-compliance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class VentasComplianceController {
  constructor(private readonly compliance: VentasComplianceOperationsService) {}

  @Get('checklist')
  @ApiOperation({ summary: 'Obtener checklist legal/operativo de una operación (propiedad + comprador)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'propertyId', required: true })
  @ApiQuery({ name: 'buyerClientId', required: true })
  async getChecklist(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Query('propertyId') propertyId: string,
    @Query('buyerClientId') buyerClientId: string,
  ) {
    return this.compliance.getChecklist(applicationSlug, propertyId, buyerClientId);
  }

  @Put('checklist')
  @ApiOperation({ summary: 'Crear/actualizar checklist legal/operativo de una operación' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async upsertChecklist(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body()
    body: {
      propertyId: string;
      buyerClientId: string;
      titleStudyChecked?: boolean;
      criChecked?: boolean;
      noLiensChecked?: boolean;
      municipalTaxClearanceChecked?: boolean;
      minutaSigned?: boolean;
      publicDeedSigned?: boolean;
      notarialPartSubmitted?: boolean;
      sunarpStatus?: string;
      sunarpSubmittedAt?: string | null;
      sunarpObservedAt?: string | null;
      sunarpRegisteredAt?: string | null;
      sunarpObservationNotes?: string | null;
      alcabalaApplicable?: boolean;
      alcabalaAmount?: number | null;
      alcabalaPaidAt?: string | null;
      rent2Applicable?: boolean;
      rent2Amount?: number | null;
      rent2PaidAt?: string | null;
      bankedPaymentRequired?: boolean;
      bankedPaymentVerified?: boolean;
      paymentMethod?: string | null;
      bankOperationNumber?: string | null;
      bankName?: string | null;
      bankAccountHolder?: string | null;
      paymentEvidencePath?: string | null;
      fundsSourceDeclared?: boolean;
      beneficialOwnerDeclared?: boolean;
      kycRiskLevel?: string;
      complianceNotes?: string | null;
      nextActionAt?: string | null;
    },
  ) {
    return this.compliance.upsertChecklist(applicationSlug, body);
  }

  @Post('documents')
  @ApiOperation({ summary: 'Adjuntar documento legal/tributario/compliance a una operación' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async addDocument(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body()
    body: {
      propertyId: string;
      buyerClientId: string;
      docType: string;
      filePath: string;
      issuedAt?: string | null;
      verifiedAt?: string | null;
      verifiedBy?: string | null;
      notes?: string | null;
    },
  ) {
    return this.compliance.addDocument(applicationSlug, body);
  }

  @Get('documents')
  @ApiOperation({ summary: 'Listar documentos de cumplimiento por operación' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'propertyId', required: true })
  @ApiQuery({ name: 'buyerClientId', required: true })
  async listDocuments(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Query('propertyId') propertyId: string,
    @Query('buyerClientId') buyerClientId: string,
  ) {
    return this.compliance.listDocuments(applicationSlug, propertyId, buyerClientId);
  }

  @Get('closing-readiness')
  @ApiOperation({ summary: 'Validar si la operación está lista para cierre de venta' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'propertyId', required: true })
  @ApiQuery({ name: 'buyerClientId', required: true })
  async closingReadiness(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Query('propertyId') propertyId: string,
    @Query('buyerClientId') buyerClientId: string,
  ) {
    return this.compliance.getClosingReadiness(applicationSlug, propertyId, buyerClientId);
  }

  @Get('tax-preview')
  @ApiOperation({ summary: 'Cálculo referencial de alcabala y renta 2da para operación de cierre' })
  @ApiQuery({ name: 'salePrice', required: true })
  @ApiQuery({ name: 'acquisitionCost', required: false })
  @ApiQuery({ name: 'alcabalaApplicable', required: false })
  @ApiQuery({ name: 'rent2Applicable', required: false })
  @ApiQuery({ name: 'uit', required: false })
  taxPreview(
    @Query('salePrice') salePrice: string,
    @Query('acquisitionCost') acquisitionCost?: string,
    @Query('alcabalaApplicable') alcabalaApplicable?: string,
    @Query('rent2Applicable') rent2Applicable?: string,
    @Query('uit') uit?: string,
  ) {
    return this.compliance.getTaxPreview({
      salePrice: Number(salePrice),
      acquisitionCost: acquisitionCost !== undefined ? Number(acquisitionCost) : undefined,
      alcabalaApplicable:
        alcabalaApplicable !== undefined ? alcabalaApplicable === 'true' : undefined,
      rent2Applicable:
        rent2Applicable !== undefined ? rent2Applicable === 'true' : undefined,
      uit: uit !== undefined ? Number(uit) : undefined,
    });
  }

  @Post('documents/upload')
  @ApiOperation({ summary: 'Subir archivo de cumplimiento y registrarlo en la operación' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body()
    body: {
      propertyId: string;
      buyerClientId: string;
      docType: string;
      issuedAt?: string | null;
      verifiedAt?: string | null;
      verifiedBy?: string | null;
      notes?: string | null;
    },
    @UploadedFile() file?: MulterUploadedFile,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Archivo requerido');
    }
    if (!body.propertyId || !body.buyerClientId || !body.docType) {
      throw new BadRequestException('propertyId, buyerClientId y docType son obligatorios');
    }
    const folder = `${body.propertyId}_${body.buyerClientId}`;
    const safeName = `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const dir = join(process.cwd(), 'uploads', 'ventas', 'compliance', folder);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, safeName), file.buffer);
    const relativePath = `ventas/compliance/${folder}/${safeName}`;
    return this.compliance.addDocument(applicationSlug, {
      propertyId: body.propertyId,
      buyerClientId: body.buyerClientId,
      docType: body.docType,
      filePath: relativePath,
      issuedAt: body.issuedAt,
      verifiedAt: body.verifiedAt,
      verifiedBy: body.verifiedBy,
      notes: body.notes,
    });
  }

  @Get('pending-board')
  @ApiOperation({ summary: 'Tablero de pendientes legales/compliance de ventas' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  @ApiQuery({ name: 'sunarpStatus', required: false })
  @ApiQuery({ name: 'onlyOverdue', required: false })
  async pendingBoard(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('sunarpStatus') sunarpStatus?: string,
    @Query('onlyOverdue') onlyOverdue?: string,
  ) {
    return this.compliance.listPendingBoard(applicationSlug, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      sunarpStatus: sunarpStatus?.trim() || undefined,
      onlyOverdue: onlyOverdue === 'true',
    });
  }

  @Post('dispatch-alerts')
  @ApiOperation({ summary: 'Generar notificaciones internas para pendientes legales/compliance' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async dispatchAlerts(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body?: { dryRun?: boolean; daysWithoutAlert?: number; maxItems?: number },
  ) {
    return this.compliance.dispatchPendingAlerts(applicationSlug, body);
  }
}
