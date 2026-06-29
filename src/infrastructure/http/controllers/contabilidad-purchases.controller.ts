import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ContabilidadPurchasesOperationsService } from '../../../application/services/contabilidad-purchases-operations.service';
import type {
  CreatePurchaseCreditNoteInput,
  CreatePurchaseInvoiceInput,
  CreatePurchasePaymentInput,
  CreateSupplierInput,
  UpdateSupplierInput,
} from '@domain/repositories/contabilidad-purchases.repository';

@ApiTags('Contabilidad — Compras')
@Controller('contabilidad-purchases')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ContabilidadPurchasesController {
  constructor(private readonly purchases: ContabilidadPurchasesOperationsService) {}

  @Get('suppliers')
  @ApiOperation({ summary: 'Listar proveedores con saldo CxP' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  listSuppliers(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('search') search?: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.purchases.listSuppliers(applicationSlug, {
      search,
      activeOnly: activeOnly !== 'false',
    });
  }

  @Post('suppliers')
  @ApiOperation({ summary: 'Registrar proveedor' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  createSupplier(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: CreateSupplierInput,
  ) {
    return this.purchases.createSupplier(applicationSlug, body);
  }

  @Patch('suppliers/:id')
  @ApiOperation({ summary: 'Actualizar proveedor' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  updateSupplier(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Param('id') id: string,
    @Body() body: UpdateSupplierInput,
  ) {
    return this.purchases.updateSupplier(applicationSlug, id, body);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Listar facturas de compra' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  listInvoices(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('periodId') periodId?: string,
    @Query('supplierId') supplierId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.purchases.listInvoices(applicationSlug, { periodId, supplierId, status, search });
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Detalle de factura de compra' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  getInvoice(@Query('applicationSlug') applicationSlug: string | undefined, @Param('id') id: string) {
    return this.purchases.getInvoice(applicationSlug, id);
  }

  @Post('invoices')
  @ApiOperation({ summary: 'Registrar factura de compra con asiento automático' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  createInvoice(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: CreatePurchaseInvoiceInput,
    @Req() req: Request & { user?: { sub?: string } },
  ) {
    return this.purchases.createInvoice(applicationSlug, body, req.user?.sub ?? null);
  }

  @Post('invoices/:id/cancel')
  @ApiOperation({ summary: 'Anular factura de compra (sin pagos)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  cancelInvoice(@Query('applicationSlug') applicationSlug: string | undefined, @Param('id') id: string) {
    return this.purchases.cancelInvoice(applicationSlug, id);
  }

  @Get('credit-notes')
  @ApiOperation({ summary: 'Listar notas de crédito de compra' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  listCreditNotes(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('periodId') periodId?: string,
    @Query('supplierId') supplierId?: string,
    @Query('search') search?: string,
  ) {
    return this.purchases.listCreditNotes(applicationSlug, { periodId, supplierId, search });
  }

  @Post('credit-notes')
  @ApiOperation({ summary: 'Registrar nota de crédito con asiento automático' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  createCreditNote(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: CreatePurchaseCreditNoteInput,
    @Req() req: Request & { user?: { sub?: string } },
  ) {
    return this.purchases.createCreditNote(applicationSlug, body, req.user?.sub ?? null);
  }

  @Get('payments')
  @ApiOperation({ summary: 'Listar pagos a proveedores' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  listPayments(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('periodId') periodId?: string,
    @Query('supplierId') supplierId?: string,
    @Query('invoiceId') invoiceId?: string,
  ) {
    return this.purchases.listPayments(applicationSlug, { periodId, supplierId, invoiceId });
  }

  @Post('payments')
  @ApiOperation({ summary: 'Registrar pago a proveedor (tesorería + CxP)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  createPayment(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: CreatePurchasePaymentInput,
    @Req() req: Request & { user?: { sub?: string } },
  ) {
    return this.purchases.createPayment(applicationSlug, body, req.user?.sub ?? null);
  }
}
