import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class AddInteriorBudgetAttachmentDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiProperty({ description: 'URL del archivo (integración de storage pendiente)' })
  @IsString()
  @MinLength(1)
  fileUrl!: string;
}
