import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class SaveCommunicationNoteDto {
  @ApiProperty({ description: 'Nota de comunicación con el inquilino', maxLength: 1000 })
  @IsString()
  @MaxLength(1000)
  note: string;
}
