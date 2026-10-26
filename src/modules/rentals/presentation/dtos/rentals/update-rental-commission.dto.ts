import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import {
  commissionDateInput,
  commissionStatusInput,
} from './rental-commission.schema';

/** Body de PATCH /rental-commissions/:rentalId */
export class UpdateRentalCommissionDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    status: commissionStatusInput,
    dueDate: commissionDateInput,
    paidDate: commissionDateInput,
  });

  @ApiProperty({ enum: ['PENDING', 'PAID'], required: false })
  status?: 'PENDING' | 'PAID';

  @ApiPropertyOptional({
    description: 'Fecha estimada de cobro (YYYY-MM-DD)',
    nullable: true,
  })
  dueDate?: string | null;

  @ApiPropertyOptional({
    description: 'Fecha efectiva de cobro (obligatoria para PAID)',
    nullable: true,
  })
  paidDate?: string | null;
}
