import { IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoadClassificacaoFilters {
  @ApiProperty({ required: false, type: Number, example: 1 })
  @IsOptional()
  grupoId?: number;
}
