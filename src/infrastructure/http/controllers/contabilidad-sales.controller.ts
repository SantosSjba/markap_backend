import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ContabilidadSalesOperationsService } from '../../../application/services/contabilidad-sales-operations.service';
import type {
  CreateCustomerInput,
  CreateSalesCollectionInput,
  CreateSalesCreditNoteInput,
  CreateSalesDebitNoteInput,
  CreateSalesInvoiceInput,
  UpdateCustomerInput,
} from '@domain/repositories/contabilidad-sales.repository';

@ApiTags('Contabilidad — Ventas')
@Controller('contabilidad-sales')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ContabilidadSalesController {
  constructor(private readonly sales: ContabilidadSalesOperationsService) {}

  @Get('customers')
  @ApiOperation({ summary: 'Listar clientes con saldo CxC' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  listCustomers(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('search') search?: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.sales.listCustomers(applicationSlug, { search, activeOnly: activeOnly !== 'false' });
  }

  @Post('customers')
  @ApiOperation({ summary: 'Registrar cliente' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  createCustomer(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: CreateCustomerInput,
  ) {
    return this.sales.createCustomer(applicationSlug, body);
  }

  @Patch('customers/:id')
  @ApiOperation({ summary: 'Actualizar cliente' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  updateCustomer(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Param('id') id: string,
    @Body() body: UpdateCustomerInput,
  ) {
    return this.sales.updateCustomer(applicationSlug, id, body);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Listar comprobantes de venta' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  listInvoices(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('periodId') periodId?: string,
    @Query('customerId') customerId?: string,
    @Query('documentType') documentType?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.sales.listInvoices(applicationSlug, {
      periodId,
      customerId,
      documentType,
      status,
      search,
    });
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Detalle de comprobante de venta' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  getInvoice(@Query('applicationSlug') applicationSlug: string | undefined, @Param('id') id: string) {
    return this.sales.getInvoice(applicationSlug, id);
  }

  @Post('invoices')
  @ApiOperation({ summary: 'Registrar venta con asiento automático' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  createInvoice(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: CreateSalesInvoiceInput,
    @Req() req: Request & { user?: { sub?: string } },
  ) {
    return this.sales.createInvoice(applicationSlug, body, req.user?.sub ?? null);
  }

  @Post('invoices/:id/cancel')
  @ApiOperation({ summary: 'Anular comprobante (sin cobros)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  cancelInvoice(@Query('applicationSlug') applicationSlug: string | undefined, @Param('id') id: string) {
    return this.sales.cancelInvoice(applicationSlug, id);
  }

  @Get('credit-notes')
  @ApiOperation({ summary: 'Listar notas de crédito de venta' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  listCreditNotes(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('periodId') periodId?: string,
    @Query('customerId') customerId?: string,
    @Query('search') search?: string,
  ) {
    return this.sales.listCreditNotes(applicationSlug, { periodId, customerId, search });
  }

  @Post('credit-notes')
  @ApiOperation({ summary: 'Registrar nota de crédito con asiento automático' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  createCreditNote(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: CreateSalesCreditNoteInput,
    @Req() req: Request & { user?: { sub?: string } },
  ) {
    return this.sales.createCreditNote(applicationSlug, body, req.user?.sub ?? null);
  }

  @Get('debit-notes')
  @ApiOperation({ summary: 'Listar notas de débito de venta' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  listDebitNotes(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('periodId') periodId?: string,
    @Query('customerId') customerId?: string,
    @Query('search') search?: string,
  ) {
    return this.sales.listDebitNotes(applicationSlug, { periodId, customerId, search });
  }

  @Post('debit-notes')
  @ApiOperation({ summary: 'Registrar nota de débito con asiento automático' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  createDebitNote(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: CreateSalesDebitNoteInput,
    @Req() req: Request & { user?: { sub?: string } },
  ) {
    return this.sales.createDebitNote(applicationSlug, body, req.user?.sub ?? null);
  }

  @Get('collections')
  @ApiOperation({ summary: 'Listar cobros de clientes' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  listCollections(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('periodId') periodId?: string,
    @Query('customerId') customerId?: string,
    @Query('invoiceId') invoiceId?: string,
  ) {
    return this.sales.listCollections(applicationSlug, { periodId, customerId, invoiceId });
  }

  @Post('collections')
  @ApiOperation({ summary: 'Registrar cobro (tesorería + CxC)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  createCollection(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: CreateSalesCollectionInput,
    @Req() req: Request & { user?: { sub?: string } },
  ) {
    return this.sales.createCollection(applicationSlug, body, req.user?.sub ?? null);
  }
}
