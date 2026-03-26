import { Injectable } from '@nestjs/common';
import {
  GetPartidasUseCase,
} from '@/api/campeonato/partidas/use-cases/get-partidas/get-partidas.use-case';
import { GetPartidasDto } from '@/api/campeonato/partidas/use-cases/get-partidas/get-partidas.dto';
import { GetPartidasFiltrosDto } from '@/api/campeonato/partidas/use-cases/get-partidas/get-partidas-filtros.dto';
import { GetPartidasPendentesUseCase } from '@/api/campeonato/partidas/use-cases/get-partidas-pendentes/get-partidas-pendentes.use-case';
import { GetPartidasRealizadasUseCase } from '@/api/campeonato/partidas/use-cases/get-partidas-realizadas/get-partidas-realizadas.use-case';

@Injectable()
export class PartidasService {
  constructor(
    private readonly getPartidasUseCase: GetPartidasUseCase,
    private readonly getPartidasPendentesUseCase: GetPartidasPendentesUseCase,
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

  async getPartidasPendentes(
    grupo: GetPartidasFiltrosDto = {},
  ): Promise<GetPartidasDto[]> {
    return this.getPartidasPendentesUseCase.execute(grupo);
  }
}
