import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class PleBookCodesDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  bookCodes!: string[];
}
