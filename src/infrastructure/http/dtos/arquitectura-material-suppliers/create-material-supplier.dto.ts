import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateArquitecturaMaterialSupplierDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  companyName!: string;

  @ApiProperty({ example: '20123456789' })
  @IsString()
  @MinLength(8)
  ruc!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactName?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string | null;
}
