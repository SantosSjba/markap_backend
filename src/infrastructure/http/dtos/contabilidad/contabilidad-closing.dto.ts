import { IsBoolean } from 'class-validator';
import {
  KeepRaw,
  OptionalValue,
} from '@common/decorators/validation.decorators';

export class ClosePeriodDto {
  @OptionalValue()
  @KeepRaw()
  @IsBoolean()
  postRegularization?: boolean;
}
