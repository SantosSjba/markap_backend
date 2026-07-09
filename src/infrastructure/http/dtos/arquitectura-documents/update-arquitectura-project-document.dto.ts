import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  ARQUITECTURA_DOCUMENT_TYPES,
  type ArquitecturaDocumentType,
} from '@domain/repositories/arquitectura-project-document.repository';

const DOC_TYPES = [...ARQUITECTURA_DOCUMENT_TYPES] as ArquitecturaDocumentType[];

export class UpdateArquitecturaProjectDocumentDto {
  @ApiPropertyOptional({ enum: DOC_TYPES })
  @IsOptional()
  @IsIn(DOC_TYPES)
  docType?: ArquitecturaDocumentType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  fileUrl?: string | null;
}
