import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class LocationCustomDto {
  @ApiProperty({ example: 'España' })
  @IsString()
  @MaxLength(120)
  country: string;

  @ApiProperty({ example: 'Comunidad de Madrid' })
  @IsString()
  @MaxLength(120)
  department: string;

  @ApiProperty({ example: 'Madrid' })
  @IsString()
  @MaxLength(120)
  province: string;

  @ApiProperty({ example: 'Centro' })
  @IsString()
  @MaxLength(120)
  district: string;
}
