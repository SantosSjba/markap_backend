import { ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import {
  booleanInput,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';
import {
  AGENT_PROJECT_ROLES,
  type AgentProjectRole,
} from '../../../domain/entities/agent.entity';

export class UpdateAgentDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    type: z
      .enum(['INTERNAL', 'EXTERNAL'], {
        error: 'El campo «tipo» no es válido.',
      })
      .nullish(),
    userId: z
      .string({ error: 'El campo «usuario» debe ser un texto.' })
      .nullish(),
    fullName: z
      .preprocess(
        primitiveText,
        z.string({ error: 'El campo «nombre completo» debe ser un texto.' }),
      )
      .nullish(),
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
    isActive: booleanInput.nullish(),
    roles: z
      .array(
        z.enum(AGENT_PROJECT_ROLES, {
          error: 'El campo «funciones» no es válido.',
        }),
        { error: 'El campo «funciones» debe ser una lista.' },
      )
      .nullish(),
  });

  @ApiPropertyOptional({
    description: 'Tipo de agente',
    enum: ['INTERNAL', 'EXTERNAL'],
  })
  type?: 'INTERNAL' | 'EXTERNAL';

  @ApiPropertyOptional({ description: 'ID del usuario (si type INTERNAL)' })
  userId?: string | null;

  @ApiPropertyOptional({ description: 'Nombre completo' })
  fullName?: string;

  @ApiPropertyOptional({ description: 'Email' })
  email?: string | null;

  @ApiPropertyOptional({ description: 'Teléfono' })
  phone?: string | null;

  @ApiPropertyOptional({ description: 'ID del tipo de documento' })
  documentTypeId?: string | null;

  @ApiPropertyOptional({ description: 'Número de documento' })
  documentNumber?: string | null;

  @ApiPropertyOptional({
    description: 'Funciones en proyectos de Interiorismo/Arquitectura',
    enum: AGENT_PROJECT_ROLES,
    isArray: true,
  })
  roles?: AgentProjectRole[] | null;

  @ApiPropertyOptional({ description: 'Activo' })
  isActive?: boolean;
}
