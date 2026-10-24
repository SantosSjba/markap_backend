import { IsBoolean } from 'class-validator';
import { KeepRaw } from '@common/decorators/validation.decorators';

export class ToggleReconciledDto {
  @KeepRaw()
  @IsBoolean()
  reconciled!: boolean;
}
