import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import {
  INTERIOR_DOCUMENT_TYPES,
  type InteriorDocumentType,
} from '@domain/repositories/interior-project-document.repository';

const DOC_TYPES = [...INTERIOR_DOCUMENT_TYPES] as InteriorDocumentType[];

export class CreateInteriorProjectDocumentDto {
  @ApiProperty()
  @IsUUID()
  projectId!: string;

  @ApiProperty({ enum: DOC_TYPES })
  @IsIn(DOC_TYPES)
  docType!: InteriorDocumentType;

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
