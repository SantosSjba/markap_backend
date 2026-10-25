import { ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import {
  booleanInput,
  hasNonBlankValue,
  isoDateInput,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

const TYPES = [
  'MEETING',
  'VISIT',
  'INSTALLATION',
  'DEADLINE',
  'TEAM_BLOCK',
] as const;

export class UpdateArquitecturaCalendarEventDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z
    .strictObject({
      eventType: z
        .preprocess(
          primitiveText,
          z.enum(TYPES, {
            error: 'El campo «tipo de evento» no es una opción permitida.',
          }),
        )
        .nullish(),
      title: z
        .preprocess(
          primitiveText,
          z
            .string({ error: 'El campo «título» debe ser un texto.' })
            .max(500, { error: 'El campo «título» es demasiado largo.' }),
        )
        .nullish(),
      description: z
        .string({ error: 'El campo «descripción» debe ser un texto.' })
        .max(8000, { error: 'El campo «descripción» es demasiado largo.' })
        .nullish(),
      location: z
        .string({ error: 'El campo «ubicación» debe ser un texto.' })
        .max(2000, { error: 'El campo «ubicación» es demasiado largo.' })
        .nullish(),
      startsAt: isoDateInput.nullish(),
      endsAt: isoDateInput.nullish(),
      allDay: booleanInput.nullish(),
      projectId: z.unknown().optional(),
      assignedAgentId: z.unknown().optional(),
    })
    .superRefine((value, ctx) => {
      if (hasNonBlankValue(value.projectId)) {
        const result = z
          .string({ error: 'El campo «proyecto» no es válido.' })
          .uuid({ error: 'El campo «proyecto» no es válido.' })
          .nullish()
          .safeParse(value['projectId']);
        if (!result.success) {
          for (const issue of result.error.issues)
            ctx.addIssue({ ...issue, path: ['projectId', ...issue.path] });
        } else {
          value['projectId'] = result.data;
        }
      }
      if (hasNonBlankValue(value.assignedAgentId)) {
        const result = z
          .string({ error: 'El campo «agente asignado» no es válido.' })
          .uuid({ error: 'El campo «agente asignado» no es válido.' })
          .nullish()
          .safeParse(value['assignedAgentId']);
        if (!result.success) {
          for (const issue of result.error.issues)
            ctx.addIssue({
              ...issue,
              path: ['assignedAgentId', ...issue.path],
            });
        } else {
          value['assignedAgentId'] = result.data;
        }
      }
    });

  @ApiPropertyOptional({ enum: TYPES })
  eventType?: string;

  @ApiPropertyOptional()
  title?: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiPropertyOptional()
  location?: string | null;

  @ApiPropertyOptional()
  startsAt?: string;

  @ApiPropertyOptional()
  endsAt?: string | null;

  @ApiPropertyOptional()
  allDay?: boolean;

  @ApiPropertyOptional()
  projectId?: string | null;

  @ApiPropertyOptional()
  assignedAgentId?: string | null;
}
