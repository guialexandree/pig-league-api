import { Injectable } from '@nestjs/common';
import { GetPartidasFiltrosDto } from '@/api/campeonato/partidas/use-cases/get-partidas/get-partidas-filtros.dto';
import { GetPartidasDto } from '@/api/campeonato/partidas/use-cases/get-partidas/get-partidas.dto';
import { PartidaStatusEnum } from '@/api/campeonato/partidas/use-cases/get-partidas/partida-status.enum';
import { GetPartidasUseCase } from '@/api/campeonato/partidas/use-cases/get-partidas/get-partidas.use-case';

@Injectable()
export class GetPartidasPendentesUseCase {
  constructor(private readonly getPartidasUseCase: GetPartidasUseCase) {}

  async execute(filters: GetPartidasFiltrosDto = {}): Promise<GetPartidasDto[]> {
    const partidas = await this.getPartidasUseCase.execute(filters);

    return partidas.filter(
      (partida) => partida.status !== PartidaStatusEnum.REALIZADA,
    );
  }
}
