import { z } from 'zod';
import {
  booleanInput,
  numericInput,
  optionalValue,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

export class PatchDocumentSeriesDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    sunatSeries: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «serie SUNAT» debe ser un texto.' }),
      ),
    ),
    lastNumber: optionalValue(numericInput),
    padLength: optionalValue(numericInput),
    isActive: optionalValue(booleanInput),
  });

  sunatSeries?: string;

  lastNumber?: number;

  padLength?: number;

  isActive?: boolean;
}

export class UpdateContabilidadSettingsDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    taxRegime: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «régimen tributario» debe ser un texto.' }),
      ),
    ),
    isDetractionAgent: optionalValue(booleanInput),
    isRetentionAgent: optionalValue(booleanInput),
    isPerceptionAgent: optionalValue(booleanInput),
    igvPercent: optionalValue(numericInput),
    currencyCode: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «moneda» debe ser un texto.' }),
      ),
    ),
    fiscalYearStartMonth: optionalValue(numericInput),
    amountDecimals: optionalValue(numericInput),
  });

  taxRegime?: string;

  isDetractionAgent?: boolean;

  isRetentionAgent?: boolean;

  isPerceptionAgent?: boolean;

  igvPercent?: number;

  currencyCode?: string;

  fiscalYearStartMonth?: number;

  amountDecimals?: number;
}

export class UpdateCompanyProfileDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    ruc: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «RUC» debe ser un texto.' }),
      ),
    ),
    legalName: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «razón social» debe ser un texto.' }),
      ),
    ),
    tradeName: optionalValue(
      z.string({ error: 'El campo «nombre comercial» debe ser un texto.' }),
    ),
    fiscalAddress: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «domicilio fiscal» debe ser un texto.' }),
      ),
    ),
    district: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «distrito» debe ser un texto.' }),
      ),
    ),
    province: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «provincia» debe ser un texto.' }),
      ),
    ),
    department: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «departamento» debe ser un texto.' }),
      ),
    ),
    ubigeoCode: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «ubigeo» debe ser un texto.' }),
      ),
    ),
  });

  ruc?: string;

  legalName?: string;

  tradeName?: string | null;

  fiscalAddress?: string;

  district?: string;

  province?: string;

  department?: string;

  ubigeoCode?: string;
}
