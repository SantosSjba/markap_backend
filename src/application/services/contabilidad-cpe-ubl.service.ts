import { Injectable } from '@nestjs/common';
import type { CpeSalesInvoiceEmitContext } from '@domain/repositories/contabilidad-cpe.repository';
import { todayDateOnlyLima } from '@domain/utils/peru-date.util';

export interface CpeUblInvoicePayload {
  invoiceTypeCode: string;
  documentRef: string;
  issueDate: string;
  currencyCode: string;
  issuerRuc: string;
  issuerLegalName: string;
  customerDocType: string;
  customerRuc: string;
  customerName: string;
  taxableBase: string;
  igvAmount: string;
  totalAmount: string;
  taxAffectation: string;
}

@Injectable()
export class ContabilidadCpeUblService {
  buildSalesInvoiceXml(ctx: CpeSalesInvoiceEmitContext): CpeUblInvoicePayload & { xml: string } {
    const invoiceTypeCode = ctx.documentType === 'BOLETA' ? '03' : '01';
    const customerDocType = ctx.customerRuc.length === 11 ? '6' : '1';
    const payload: CpeUblInvoicePayload = {
      invoiceTypeCode,
      documentRef: ctx.fullNumber,
      issueDate: ctx.issueDate,
      currencyCode: ctx.currencyCode,
      issuerRuc: ctx.issuerRuc,
      issuerLegalName: ctx.issuerLegalName,
      customerDocType,
      customerRuc: ctx.customerRuc,
      customerName: ctx.customerName,
      taxableBase: ctx.taxableBase,
      igvAmount: ctx.igvAmount,
      totalAmount: ctx.totalAmount,
      taxAffectation: ctx.taxAffectation,
    };

    const xml = this.renderInvoiceXml(payload);
    return { ...payload, xml };
  }

  private renderInvoiceXml(p: CpeUblInvoicePayload): string {
    const uuid = `MARKAP-${p.documentRef.replace(/-/g, '')}-${Date.now()}`;
    return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>2.0</cbc:CustomizationID>
  <cbc:ID>${this.escape(p.documentRef)}</cbc:ID>
  <cbc:IssueDate>${p.issueDate}</cbc:IssueDate>
  <cbc:InvoiceTypeCode listAgencyName="PE:SUNAT" listName="Tipo de Documento" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo01">${p.invoiceTypeCode}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${this.escape(p.currencyCode)}</cbc:DocumentCurrencyCode>
  <cac:Signature>
    <cbc:ID>MARKAP-SIGN</cbc:ID>
    <cac:SignatoryParty>
      <cac:PartyIdentification><cbc:ID>${this.escape(p.issuerRuc)}</cbc:ID></cac:PartyIdentification>
      <cac:PartyName><cbc:Name>${this.escape(p.issuerLegalName)}</cbc:Name></cac:PartyName>
    </cac:SignatoryParty>
  </cac:Signature>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification><cbc:ID schemeID="6">${this.escape(p.issuerRuc)}</cbc:ID></cac:PartyIdentification>
      <cac:PartyLegalEntity><cbc:RegistrationName>${this.escape(p.issuerLegalName)}</cbc:RegistrationName></cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification><cbc:ID schemeID="${p.customerDocType}">${this.escape(p.customerRuc)}</cbc:ID></cac:PartyIdentification>
      <cac:PartyLegalEntity><cbc:RegistrationName>${this.escape(p.customerName)}</cbc:RegistrationName></cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${this.escape(p.currencyCode)}">${p.igvAmount}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${this.escape(p.currencyCode)}">${p.taxableBase}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${this.escape(p.currencyCode)}">${p.igvAmount}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cac:TaxScheme><cbc:ID>1000</cbc:ID><cbc:Name>IGV</cbc:Name><cbc:TaxTypeCode>VAT</cbc:TaxTypeCode></cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${this.escape(p.currencyCode)}">${p.taxableBase}</cbc:LineExtensionAmount>
    <cbc:TaxInclusiveAmount currencyID="${this.escape(p.currencyCode)}">${p.totalAmount}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${this.escape(p.currencyCode)}">${p.totalAmount}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  <cac:InvoiceLine>
    <cbc:ID>1</cbc:ID>
    <cbc:InvoicedQuantity unitCode="NIU">1</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="${this.escape(p.currencyCode)}">${p.taxableBase}</cbc:LineExtensionAmount>
    <cac:Item><cbc:Description>Venta contable ${this.escape(p.documentRef)}</cbc:Description></cac:Item>
    <cac:Price><cbc:PriceAmount currencyID="${this.escape(p.currencyCode)}">${p.taxableBase}</cbc:PriceAmount></cac:Price>
  </cac:InvoiceLine>
  <!-- UUID: ${uuid} -->
</Invoice>`;
  }

  buildMockCdr(documentRef: string, responseCode: string, description: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<ApplicationResponse xmlns="urn:oasis:names:specification:ubl:schema:xsd:ApplicationResponse-2">
  <cbc:ResponseDate>${todayDateOnlyLima()}</cbc:ResponseDate>
  <cbc:ResponseTime>${new Date().toISOString().slice(11, 19)}</cbc:ResponseTime>
  <cac:DocumentResponse>
    <cac:Response>
      <cbc:ReferenceID>${this.escape(documentRef)}</cbc:ReferenceID>
      <cbc:ResponseCode>${this.escape(responseCode)}</cbc:ResponseCode>
      <cbc:Description>${this.escape(description)}</cbc:Description>
    </cac:Response>
  </cac:DocumentResponse>
</ApplicationResponse>`;
  }

  private escape(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
