import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { primitiveText } from '../../../../../shared/presentation/validation/input-schemas';

export class CreateArquitecturaMaterialSupplierDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    companyName: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «empresa» debe ser un texto.' })
        .min(1, { error: 'El campo «empresa» es demasiado corto.' }),
    ),
    ruc: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «RUC» debe ser un texto.' })
        .min(8, { error: 'El campo «RUC» es demasiado corto.' }),
    ),
    contactName: z
      .string({ error: 'El campo «contacto» debe ser un texto.' })
      .nullish(),
    phone: z
      .string({ error: 'El campo «teléfono» debe ser un texto.' })
      .nullish(),
    email: z
      .string({ error: 'El campo «correo» debe ser un texto.' })
      .nullish(),
  });

  @ApiProperty()
  companyName!: string;

  @ApiProperty({ example: '20123456789' })
  ruc!: string;

  @ApiPropertyOptional()
  contactName?: string | null;

  @ApiPropertyOptional()
  phone?: string | null;

  @ApiPropertyOptional()
  email?: string | null;
}
