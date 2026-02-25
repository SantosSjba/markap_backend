import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsUUID, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';

const VALUE_TYPES = ['PERCENT', 'FIXED'] as const;

export class UpsertRentalFinancialConfigDto {
  @ApiPropertyOptional({ enum: ['PEN', 'USD'] })
  @IsOptional()
  @IsString()
  @IsIn(['PEN', 'USD'])
  currency?: string;

  @ApiPropertyOptional({ description: 'Tipo de gasto', enum: ['PERCENT', 'FIXED'] })
  @IsOptional()
  @IsString()
  @IsIn(VALUE_TYPES)
  expenseType?: 'PERCENT' | 'FIXED';

  @ApiPropertyOptional({ description: 'Valor de gasto (% o monto fijo)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  expenseValue?: number;

  @ApiPropertyOptional({ description: 'Tipo de impuesto', enum: ['PERCENT', 'FIXED'] })
  @IsOptional()
  @IsString()
  @IsIn(VALUE_TYPES)
  taxType?: 'PERCENT' | 'FIXED';

  @ApiPropertyOptional({ description: 'Valor de impuesto (% o monto fijo)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  taxValue?: number;

  @ApiPropertyOptional({ description: 'ID del agente externo (tabla agents, type EXTERNAL)' })
  @IsOptional()
  @IsString()
  @IsUUID()
  externalAgentId?: string | null;

  @ApiPropertyOptional({ description: 'Tipo de comisión agente externo', enum: ['PERCENT', 'FIXED'] })
  @IsOptional()
  @IsString()
  @IsIn(VALUE_TYPES)
  externalAgentType?: 'PERCENT' | 'FIXED';

  @ApiPropertyOptional({ description: 'Valor comisión agente externo' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  externalAgentValue?: number;

  @ApiPropertyOptional({ description: 'Nombre del agente externo (si no se usa externalAgentId)' })
  @IsOptional()
  @IsString()
  externalAgentName?: string | null;

  @ApiPropertyOptional({ description: 'ID del usuario agente interno' })
  @IsOptional()
  @IsString()
  @IsUUID()
  internalAgentId?: string | null;

  @ApiPropertyOptional({ description: 'Tipo de comisión agente interno', enum: ['PERCENT', 'FIXED'] })
  @IsOptional()
  @IsString()
  @IsIn(VALUE_TYPES)
  internalAgentType?: 'PERCENT' | 'FIXED';

  @ApiPropertyOptional({ description: 'Valor comisión agente interno' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  internalAgentValue?: number;
}
