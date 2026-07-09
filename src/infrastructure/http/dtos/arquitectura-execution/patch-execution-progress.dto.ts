import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

export class PatchArquitecturaExecutionProgressDto {
  @ApiProperty({ description: 'Avance global del proyecto 0â€“100' })
  @IsNumber()
  @Min(0)
  @Max(100)
  progressPct!: number;
}
