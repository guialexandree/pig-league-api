import { Injectable } from '@nestjs/common';
import {
  GetPartidasUseCase,
} from '@/api/campeonato/partidas/use-cases/get-partidas/get-partidas.use-case';
import { GetPartidasDto } from '@/api/campeonato/partidas/use-cases/get-partidas/get-partidas.dto';
import { GetPartidasFiltrosDto } from '@/api/campeonato/partidas/use-cases/get-partidas/get-partidas-filtros.dto';

@Injectable()
export class PartidasService {
  constructor(private readonly getPartidasUseCase: GetPartidasUseCase) {}

  async getPartidas(grupo: GetPartidasFiltrosDto): Promise<GetPartidasDto> {
    return this.getPartidasUseCase.execute(grupo);
  }
}
