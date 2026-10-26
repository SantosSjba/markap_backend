import { RequiresApplication } from '../../../../shared/presentation/decorators/application-access.decorators';
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
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { FileStoragePort } from '../../../../shared/application/ports/file-storage.port';
import { JwtAuthGuard } from '../../../../shared/presentation/guards/jwt-auth.guard';
import type { UploadedFile as MulterUploadedFile } from '../../../../shared/types/uploaded-file.types';
import { parseIntegerQuery } from '../../../../shared/utils/parse-integer-query.util';
import { VentasComplianceOperationsService } from '../../application/services/ventas-compliance-operations.service';
import {
  CreateComplianceDocumentDto,
  DispatchComplianceAlertsDto,
  UploadComplianceDocumentDto,
  UploadPaymentEvidenceDto,
  UpsertComplianceChecklistDto,
} from '../dtos/ventas/ventas-compliance-requests.dto';

@ApiTags('Ventas — Cumplimiento Legal')
@RequiresApplication('ventas')
@Controller('ventas-compliance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class VentasComplianceController {
  constructor(
    private readonly compliance: VentasComplianceOperationsService,
    private readonly genArchivo: FileStoragePort,
  ) {}

  @Get('checklist')
  @ApiOperation({
    summary:
      'Obtener checklist legal/operativo de una operación (propiedad + comprador)',
  })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'propertyId', required: true })
  @ApiQuery({ name: 'buyerClientId', required: true })
  async getChecklist(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Query('propertyId') propertyId: string,
    @Query('buyerClientId') buyerClientId: string,
  ) {
    return this.compliance.getChecklist(
      applicationSlug,
      propertyId,
      buyerClientId,
    );
  }

  @Put('checklist')
  @ApiOperation({
    summary: 'Crear/actualizar checklist legal/operativo de una operación',
  })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async upsertChecklist(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body()
    body: UpsertComplianceChecklistDto,
  ) {
    return this.compliance.upsertChecklist(applicationSlug, body);
  }

  @Post('documents')
  @ApiOperation({
    summary: 'Adjuntar documento legal/tributario/compliance a una operación',
  })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async addDocument(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body()
    body: CreateComplianceDocumentDto,
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
    return this.compliance.listDocuments(
      applicationSlug,
      propertyId,
      buyerClientId,
    );
  }

  @Get('closing-readiness')
  @ApiOperation({
    summary: 'Validar si la operación está lista para cierre de venta',
  })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'propertyId', required: true })
  @ApiQuery({ name: 'buyerClientId', required: true })
  async closingReadiness(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Query('propertyId') propertyId: string,
    @Query('buyerClientId') buyerClientId: string,
  ) {
    return this.compliance.getClosingReadiness(
      applicationSlug,
      propertyId,
      buyerClientId,
    );
  }

  @Get('tax-preview')
  @ApiOperation({
    summary:
      'Cálculo referencial de alcabala y renta 2da para operación de cierre',
  })
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
      acquisitionCost:
        acquisitionCost !== undefined ? Number(acquisitionCost) : undefined,
      alcabalaApplicable:
        alcabalaApplicable !== undefined
          ? alcabalaApplicable === 'true'
          : undefined,
      rent2Applicable:
        rent2Applicable !== undefined ? rent2Applicable === 'true' : undefined,
      uit: uit !== undefined ? Number(uit) : undefined,
    });
  }

  @Post('checklist/payment-evidence')
  @ApiOperation({
    summary: 'Subir evidencia de pago bancarizado del checklist',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'propertyId', 'buyerClientId'],
      properties: {
        file: { type: 'string', format: 'binary' },
        propertyId: { type: 'string' },
        buyerClientId: { type: 'string' },
      },
    },
  })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @UseInterceptors(FileInterceptor('file'))
  async uploadPaymentEvidence(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body()
    body: UploadPaymentEvidenceDto,
    @UploadedFile() file?: MulterUploadedFile,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Archivo requerido');
    }
    if (!body.propertyId || !body.buyerClientId) {
      throw new BadRequestException(
        'propertyId y buyerClientId son obligatorios',
      );
    }
    const slug = applicationSlug ?? 'ventas';
    const entityId = `${body.propertyId}_${body.buyerClientId}`;
    const archivo = await this.genArchivo.upload(
      {
        applicationSlug: slug,
        module: 'compliance',
        entityType: 'sale_operation',
        entityId,
        category: 'payment_evidence',
      },
      file,
    );
    return this.compliance.uploadPaymentEvidence(applicationSlug, {
      propertyId: body.propertyId,
      buyerClientId: body.buyerClientId,
      filePath: archivo.objectKey,
      archivoId: archivo.id,
    });
  }

  @Post('documents/upload')
  @ApiOperation({
    summary: 'Subir archivo de cumplimiento y registrarlo en la operación',
  })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({ name: 'applicationSlug', required: false })
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body()
    body: UploadComplianceDocumentDto,
    @UploadedFile() file?: MulterUploadedFile,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Archivo requerido');
    }
    if (!body.propertyId || !body.buyerClientId || !body.docType) {
      throw new BadRequestException(
        'propertyId, buyerClientId y docType son obligatorios',
      );
    }
    const slug = applicationSlug ?? 'ventas';
    const entityId = `${body.propertyId}_${body.buyerClientId}`;
    const archivo = await this.genArchivo.upload(
      {
        applicationSlug: slug,
        module: 'compliance',
        entityType: 'sale_operation',
        entityId,
        category: body.docType,
      },
      file,
    );
    return this.compliance.addDocument(applicationSlug, {
      propertyId: body.propertyId,
      buyerClientId: body.buyerClientId,
      docType: body.docType,
      filePath: archivo.objectKey,
      archivoId: archivo.id,
      issuedAt: body.issuedAt,
      verifiedAt: body.verifiedAt,
      verifiedBy: body.verifiedBy,
      notes: body.notes,
    });
  }

  @Get('pending-board')
  @ApiOperation({
    summary: 'Tablero de pendientes legales/compliance de ventas',
  })
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
      limit: limit ? parseIntegerQuery(limit, 20, 1, 100) : undefined,
      offset: offset ? parseIntegerQuery(offset, 0, 0, 1000000) : undefined,
      sunarpStatus: sunarpStatus?.trim() || undefined,
      onlyOverdue: onlyOverdue === 'true',
    });
  }

  @Post('dispatch-alerts')
  @ApiOperation({
    summary:
      'Generar notificaciones internas para pendientes legales/compliance',
  })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async dispatchAlerts(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body?: DispatchComplianceAlertsDto,
  ) {
    return this.compliance.dispatchPendingAlerts(applicationSlug, body);
  }
}
