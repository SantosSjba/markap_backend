import { IsNotEmpty, IsString } from 'class-validator';
import { OptionalValue } from '@common/decorators/validation.decorators';

export class EvidenceUploadDto {
  @OptionalValue()
  @IsString()
  taskId?: string;

  @OptionalValue()
  @IsString()
  kind?: string;

  @OptionalValue()
  @IsString()
  title?: string;

  @OptionalValue()
  @IsString()
  capturedAt?: string;
}

export class PropertyMediaDeleteDto {
  @IsString()
  @IsNotEmpty()
  url!: string;

  @OptionalValue()
  @IsString()
  archivoId?: string;
}

export class PropertyMediaUploadDto {
  @OptionalValue()
  @IsString()
  kind?: string;
}

export class BudgetAttachmentDto {
  @OptionalValue()
  @IsString()
  lineItemId?: string | null;

  @OptionalValue()
  @IsString()
  title?: string;
}

export class ProjectDocumentUploadDto {
  @OptionalValue()
  @IsString()
  projectId?: string;

  @OptionalValue()
  @IsString()
  docType?: string;

  @OptionalValue()
  @IsString()
  title?: string;
}

export class CatalogMaterialUploadDto {
  @OptionalValue()
  @IsString()
  kind?: string;

  @OptionalValue()
  @IsString()
  materialId?: string;
}
