import { ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { booleanInput } from '../../../../../shared/presentation/validation/input-schemas';

export class UpsertAlertConfigDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    alert30Days: booleanInput.nullish(),
    alert60Days: booleanInput.nullish(),
    alert90Days: booleanInput.nullish(),
    alertPendingPayment: booleanInput.nullish(),
    alertOverduePayment: booleanInput.nullish(),
    channelInApp: booleanInput.nullish(),
    channelEmail: booleanInput.nullish(),
    channelWhatsapp: booleanInput.nullish(),
  });

  @ApiPropertyOptional({ description: 'Alerta a 30 días de vencimiento' })
  alert30Days?: boolean;

  @ApiPropertyOptional({ description: 'Alerta a 60 días de vencimiento' })
  alert60Days?: boolean;

  @ApiPropertyOptional({ description: 'Alerta a 90 días de vencimiento' })
  alert90Days?: boolean;

  @ApiPropertyOptional({
    description: 'Alerta de pago pendiente próximo a vencer',
  })
  alertPendingPayment?: boolean;

  @ApiPropertyOptional({ description: 'Alerta de pago atrasado/vencido' })
  alertOverduePayment?: boolean;

  @ApiPropertyOptional({ description: 'Canal: notificación in-app' })
  channelInApp?: boolean;

  @ApiPropertyOptional({ description: 'Canal: email (futuro)' })
  channelEmail?: boolean;

  @ApiPropertyOptional({ description: 'Canal: WhatsApp (futuro)' })
  channelWhatsapp?: boolean;
}
