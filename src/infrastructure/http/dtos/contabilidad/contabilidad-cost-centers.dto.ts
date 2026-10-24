import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';
import {
  KeepRaw,
  OptionalValue,
} from '@common/decorators/validation.decorators';
import type {
  CreateContabilidadCostCenterInput,
  UpdateContabilidadCostCenterInput,
} from '@domain/repositories/contabilidad-period.repository';

export class UpdateContabilidadCostCenterDto implements UpdateContabilidadCostCenterInput {
  @OptionalValue()
  @IsString()
  code?: string;

  @OptionalValue()
  @IsString()
  name?: string;

  @OptionalValue()
  @IsString()
  parentId?: string | null;

  @OptionalValue()
  @KeepRaw()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateContabilidadCostCenterDto implements CreateContabilidadCostCenterInput {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @OptionalValue()
  @IsString()
  parentId?: string | null;
}
