import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import {
  ARQUITECTURA_DOCUMENT_TYPES,
  type ArquitecturaDocumentType,
} from '@domain/repositories/arquitectura-project-document.repository';

const DOC_TYPES = [...ARQUITECTURA_DOCUMENT_TYPES] as ArquitecturaDocumentType[];

export class CreateArquitecturaProjectDocumentDto {
  @ApiProperty()
  @IsUUID()
  projectId!: string;

  @ApiProperty({ enum: DOC_TYPES })
  @IsIn(DOC_TYPES)
  docType!: ArquitecturaDocumentType;

  @ApiProperty()
  @IsString()
  @MaxLength(500)
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  fileUrl?: string | null;
}
