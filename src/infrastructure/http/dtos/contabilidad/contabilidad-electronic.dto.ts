import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';
import {
  KeepRaw,
  OptionalValue,
} from '@common/decorators/validation.decorators';
import type { UpsertCpeProviderConfigInput } from '@domain/repositories/contabilidad-cpe.repository';
import type { UpsertSolCredentialsInput } from '@domain/repositories/contabilidad-sol.repository';

export class UpsertSolCredentialsDto implements UpsertSolCredentialsInput {
  @IsString()
  @IsNotEmpty()
  solUser!: string;

  @OptionalValue()
  @IsString()
  solPassword?: string | null;

  @OptionalValue()
  @KeepRaw()
  @IsBoolean()
  useSandbox?: boolean;

  @OptionalValue()
  @KeepRaw()
  @IsBoolean()
  isActive?: boolean;
}

export class UpsertCpeProviderConfigDto implements UpsertCpeProviderConfigInput {
  @IsString()
  @IsNotEmpty()
  providerCode!: string;

  @OptionalValue()
  @IsString()
  apiBaseUrl?: string | null;

  @OptionalValue()
  @IsString()
  apiToken?: string | null;

  @OptionalValue()
  @IsString()
  certificateHint?: string | null;

  @OptionalValue()
  @KeepRaw()
  @IsBoolean()
  useSandbox?: boolean;

  @OptionalValue()
  @KeepRaw()
  @IsBoolean()
  isActive?: boolean;
}
