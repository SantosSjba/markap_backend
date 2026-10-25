import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { primitiveText } from '../../../../../shared/presentation/validation/input-schemas';

export class SaveCommunicationNoteDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    note: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «nota» debe ser un texto.' })
        .max(1000, { error: 'El campo «nota» es demasiado largo.' }),
    ),
  });

  @ApiProperty({
    description: 'Nota de comunicación con el inquilino',
    maxLength: 1000,
  })
  note: string;
}
