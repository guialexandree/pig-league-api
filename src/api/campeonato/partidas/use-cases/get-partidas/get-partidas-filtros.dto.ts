import { IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetPartidasFiltrosDto {
  @ApiProperty({ required: false, type: Number, example: 1 })
  @IsOptional()
  grupoId?: number;
}
