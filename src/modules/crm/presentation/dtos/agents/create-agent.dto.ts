import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { primitiveText } from '../../../../../shared/presentation/validation/input-schemas';

export class CreateAgentDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    applicationId: z
      .preprocess(
        primitiveText,
        z.string({ error: 'El campo «aplicación» debe ser un texto.' }),
      )
      .nullish(),
    applicationSlug: z
      .preprocess(
        primitiveText,
        z.string({ error: 'El campo «aplicación» debe ser un texto.' }),
      )
      .nullish(),
    type: z.enum(['INTERNAL', 'EXTERNAL'], {
      error: 'El campo «tipo» no es válido.',
    }),
    userId: z
      .string({ error: 'El campo «usuario» debe ser un texto.' })
      .nullish(),
    fullName: z.preprocess(
      primitiveText,
      z.string({ error: 'El campo «nombre completo» debe ser un texto.' }),
    ),
    email: z
      .string({ error: 'El campo «correo» debe ser un texto.' })
      .nullish(),
    phone: z
      .string({ error: 'El campo «teléfono» debe ser un texto.' })
      .nullish(),
    documentTypeId: z
      .string({ error: 'El campo «tipo de documento» debe ser un texto.' })
      .nullish(),
    documentNumber: z
      .string({ error: 'El campo «número de documento» debe ser un texto.' })
      .nullish(),
  });

  @ApiPropertyOptional({ description: 'ID de la aplicación' })
  applicationId?: string;

  @ApiPropertyOptional({
    description: 'Slug de la aplicación (ej. alquileres, ventas)',
  })
  applicationSlug?: string;

  @ApiProperty({
    description:
      'Tipo de agente: Interno (usuario del sistema) o Externo (tercero)',
    enum: ['INTERNAL', 'EXTERNAL'],
  })
  type: 'INTERNAL' | 'EXTERNAL';

  @ApiPropertyOptional({
    description: 'ID del usuario (requerido si type es INTERNAL)',
  })
  userId?: string | null;

  @ApiProperty({
    description:
      'Nombre completo (para EXTERNAL es obligatorio; para INTERNAL puede derivarse del usuario)',
  })
  fullName: string;

  @ApiPropertyOptional({ description: 'Email' })
  email?: string | null;

  @ApiPropertyOptional({ description: 'Teléfono' })
  phone?: string | null;

  @ApiPropertyOptional({ description: 'ID del tipo de documento' })
  documentTypeId?: string | null;

  @ApiPropertyOptional({ description: 'Número de documento' })
  documentNumber?: string | null;
}
