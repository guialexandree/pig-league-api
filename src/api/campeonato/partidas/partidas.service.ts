import { Injectable } from '@nestjs/common';
import {
  GetPartidasUseCase,
} from '@/api/campeonato/partidas/use-cases/get-partidas/get-partidas.use-case';
import { GetPartidasDto } from '@/api/campeonato/partidas/use-cases/get-partidas/get-partidas.dto';
import { GetPartidasFiltrosDto } from '@/api/campeonato/partidas/use-cases/get-partidas/get-partidas-filtros.dto';
import { GetPartidasRealizadasUseCase } from '@/api/campeonato/partidas/use-cases/get-partidas-realizadas/get-partidas-realizadas.use-case';

@Injectable()
export class PartidasService {
  constructor(
    private readonly getPartidasUseCase: GetPartidasUseCase,
    private readonly getPartidasRealizadasUseCase: GetPartidasRealizadasUseCase,
  ) {}

  async getPartidas(grupo: GetPartidasFiltrosDto = {}): Promise<GetPartidasDto[]> {
    return this.getPartidasUseCase.execute(grupo);
  }

  async getPartidasRealizadas(
    grupo: GetPartidasFiltrosDto = {},
  ): Promise<GetPartidasDto[]> {
    return this.getPartidasRealizadasUseCase.execute(grupo);
  }
}
