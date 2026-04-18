import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, MaxLength } from 'class-validator';

export class PropertyMediaItemDto {
  @ApiProperty({ example: 'https://ejemplo.com/foto.jpg' })
  @IsString()
  @MaxLength(2048)
  url: string;

  @ApiProperty({ enum: ['photo', 'plan'] })
  @IsIn(['photo', 'plan'])
  kind: 'photo' | 'plan';
}
