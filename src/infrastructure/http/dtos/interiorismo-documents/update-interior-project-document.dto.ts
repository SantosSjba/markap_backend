import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  INTERIOR_DOCUMENT_TYPES,
  type InteriorDocumentType,
} from '@domain/repositories/interior-project-document.repository';

const DOC_TYPES = [...INTERIOR_DOCUMENT_TYPES] as InteriorDocumentType[];

export class UpdateInteriorProjectDocumentDto {
  @ApiPropertyOptional({ enum: DOC_TYPES })
  @IsOptional()
  @IsIn(DOC_TYPES)
  docType?: InteriorDocumentType;

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
