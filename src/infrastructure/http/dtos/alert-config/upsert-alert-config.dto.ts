import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertAlertConfigDto {
  @ApiPropertyOptional({ description: 'Alerta a 30 días de vencimiento' })
  @IsBoolean()
  @IsOptional()
  alert30Days?: boolean;

  @ApiPropertyOptional({ description: 'Alerta a 60 días de vencimiento' })
  @IsBoolean()
  @IsOptional()
  alert60Days?: boolean;

  @ApiPropertyOptional({ description: 'Alerta a 90 días de vencimiento' })
  @IsBoolean()
  @IsOptional()
  alert90Days?: boolean;

  @ApiPropertyOptional({ description: 'Alerta de pago pendiente próximo a vencer' })
  @IsBoolean()
  @IsOptional()
  alertPendingPayment?: boolean;

  @ApiPropertyOptional({ description: 'Alerta de pago atrasado/vencido' })
  @IsBoolean()
  @IsOptional()
  alertOverduePayment?: boolean;

  @ApiPropertyOptional({ description: 'Canal: notificación in-app' })
  @IsBoolean()
  @IsOptional()
  channelInApp?: boolean;

  @ApiPropertyOptional({ description: 'Canal: email (futuro)' })
  @IsBoolean()
  @IsOptional()
  channelEmail?: boolean;

  @ApiPropertyOptional({ description: 'Canal: WhatsApp (futuro)' })
  @IsBoolean()
  @IsOptional()
  channelWhatsapp?: boolean;
}
