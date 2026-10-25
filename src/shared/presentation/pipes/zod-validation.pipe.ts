import { createZodValidationPipe } from 'nestjs-zod';
import type { ZodError } from 'zod';
import { validationExceptionFactory } from './validation-messages';

/** Una sola política para los DTO HTTP registrados con un esquema Zod. */
export const ZodValidationPipe = createZodValidationPipe({
  createValidationException: (error) =>
    validationExceptionFactory(error as ZodError),
});
