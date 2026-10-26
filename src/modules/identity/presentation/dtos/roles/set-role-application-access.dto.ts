import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
export class SetRoleApplicationAccessDto extends createZodDto(
  z.object({ accessLevel: z.enum(['READ', 'WRITE', 'ADMIN']) }).strict(),
) {}
