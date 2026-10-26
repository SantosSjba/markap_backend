import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
const date = z.iso.date().optional();
export class ListAuditLogsQuery extends createZodDto(
  z
    .object({
      userId: z.string().optional(),
      applicationId: z.string().optional(),
      action: z.string().optional(),
      tableName: z.string().optional(),
      recordId: z.string().optional(),
      from: date,
      to: date,
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce
        .number()
        .int()
        .min(1)
        .transform((n) => Math.min(n, 200))
        .default(50),
    })
    .strict(),
) {}
