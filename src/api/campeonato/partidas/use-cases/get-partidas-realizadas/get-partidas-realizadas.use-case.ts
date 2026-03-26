import { Injectable } from '@nestjs/common';
import { GetPartidasFiltrosDto } from '@/api/campeonato/partidas/use-cases/get-partidas/get-partidas-filtros.dto';
import { GetPartidasDto } from '@/api/campeonato/partidas/use-cases/get-partidas/get-partidas.dto';
import { PartidaStatusEnum } from '@/api/campeonato/partidas/use-cases/get-partidas/partida-status.enum';
import { GetPartidasUseCase } from '@/api/campeonato/partidas/use-cases/get-partidas/get-partidas.use-case';
import { getTime, isValid, parseISO } from 'date-fns';

@Injectable()
export class GetPartidasRealizadasUseCase {
  constructor(private readonly getPartidasUseCase: GetPartidasUseCase) {}

  async execute(filters: GetPartidasFiltrosDto = {}): Promise<GetPartidasDto[]> {
    const partidas = await this.getPartidasUseCase.execute(filters);

    return partidas
      .filter((partida) => partida.status === PartidaStatusEnum.REALIZADA)
      .sort((partidaAtual, proximaPartida) => {
        const currentMatchTimestamp = this.getTimestamp(partidaAtual.dataHora);
        const nextMatchTimestamp = this.getTimestamp(proximaPartida.dataHora);

        return nextMatchTimestamp - currentMatchTimestamp;
      });
  }

  private getTimestamp(dataHora: string | null): number {
    if (!dataHora) {
      return Number.NEGATIVE_INFINITY;
    }

    const parsedTimestamp = parseISO(dataHora);
    return isValid(parsedTimestamp) ? getTime(parsedTimestamp) : Number.NEGATIVE_INFINITY;
  }
}
