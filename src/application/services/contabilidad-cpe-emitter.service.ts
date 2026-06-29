import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CONTABILIDAD_CPE_PROVIDER,
  CONTABILIDAD_CPE_SUNAT_MOCK_ACCEPT_CODE,
  CONTABILIDAD_CPE_SUNAT_MOCK_ACCEPT_MESSAGE,
} from '@domain/constants/contabilidad-cpe.defaults';
import type { ContabilidadCpeProviderConfigDto } from '@domain/repositories/contabilidad-cpe.repository';
import { ContabilidadCpeUblService } from './contabilidad-cpe-ubl.service';

export interface CpeEmitInput {
  xml: string;
  documentRef: string;
  config: ContabilidadCpeProviderConfigDto;
}

export interface CpeEmitOutput {
  sunatStatus: 'SENT' | 'ACCEPTED' | 'REJECTED';
  responseCode: string;
  responseMessage: string;
  cdrReference: string | null;
  cdrContent: string | null;
  sentAt: Date;
  acceptedAt: Date | null;
}

@Injectable()
export class ContabilidadCpeEmitterService {
  constructor(private readonly ubl: ContabilidadCpeUblService) {}

  async emit(input: CpeEmitInput): Promise<CpeEmitOutput> {
    const sentAt = new Date();

    if (!input.config.isActive) {
      throw new BadRequestException('El proveedor de facturación electrónica está inactivo.');
    }

    switch (input.config.providerCode) {
      case CONTABILIDAD_CPE_PROVIDER.MOCK:
        return this.emitMock(input, sentAt);
      case CONTABILIDAD_CPE_PROVIDER.NUBEFACT:
      case CONTABILIDAD_CPE_PROVIDER.BIZLINKS:
      case CONTABILIDAD_CPE_PROVIDER.SUNAT:
        throw new BadRequestException(
          `Proveedor ${input.config.providerCode} pendiente de integración. Use MOCK (sandbox) mientras se configura OSE/PSE.`,
        );
      default:
        throw new BadRequestException(`Proveedor CPE desconocido: ${input.config.providerCode}`);
    }
  }

  private emitMock(input: CpeEmitInput, sentAt: Date): CpeEmitOutput {
    const cdrReference = `CDR-${input.documentRef}-${sentAt.getTime()}`;
    const cdrContent = this.ubl.buildMockCdr(
      input.documentRef,
      CONTABILIDAD_CPE_SUNAT_MOCK_ACCEPT_CODE,
      CONTABILIDAD_CPE_SUNAT_MOCK_ACCEPT_MESSAGE,
    );

    return {
      sunatStatus: 'ACCEPTED',
      responseCode: CONTABILIDAD_CPE_SUNAT_MOCK_ACCEPT_CODE,
      responseMessage: input.config.useSandbox
        ? `${CONTABILIDAD_CPE_SUNAT_MOCK_ACCEPT_MESSAGE} [sandbox]`
        : CONTABILIDAD_CPE_SUNAT_MOCK_ACCEPT_MESSAGE,
      cdrReference,
      cdrContent,
      sentAt,
      acceptedAt: sentAt,
    };
  }
}
