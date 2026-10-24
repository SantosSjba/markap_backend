import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';
import {
  IsNumeric,
  KeepRaw,
  OptionalValue,
} from '@common/decorators/validation.decorators';
import type {
  CreateContabilidadAccountInput,
  UpdateContabilidadAccountInput,
} from '@domain/repositories/contabilidad-account.repository';

export class UpdateContabilidadAccountDto implements UpdateContabilidadAccountInput {
  @OptionalValue()
  @IsString()
  code?: string;

  @OptionalValue()
  @IsString()
  name?: string;

  @OptionalValue()
  @IsString()
  accountType?: string;

  @OptionalValue()
  @KeepRaw()
  @IsBoolean()
  isMovement?: boolean;

  @OptionalValue()
  @KeepRaw()
  @IsNumeric()
  sortOrder?: number;

  @OptionalValue()
  @KeepRaw()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateContabilidadAccountDto implements CreateContabilidadAccountInput {
  @IsString()
  @IsNotEmpty()
  parentId!: string;

  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  accountType!: string;

  @KeepRaw()
  @IsBoolean()
  isMovement!: boolean;

  @OptionalValue()
  @KeepRaw()
  @IsNumeric()
  sortOrder?: number;
}
