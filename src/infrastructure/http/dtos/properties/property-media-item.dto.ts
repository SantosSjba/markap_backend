import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class PropertyMediaItemDto {
  @ApiProperty({ example: 'https://ejemplo.com/foto.jpg' })
  @IsString()
  @MaxLength(2048)
  url: string;

  @ApiProperty({ enum: ['photo', 'plan'] })
  @IsIn(['photo', 'plan'])
  kind: 'photo' | 'plan';

  @ApiPropertyOptional({ description: 'ID GenArchivo cuando el media se subió a MinIO' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  archivoId?: string;
}
