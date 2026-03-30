import { Injectable } from '@nestjs/common';
import { GetPartidasUseCase } from '@/api/campeonato/partidas/use-cases/get-partidas/get-partidas.use-case';
import { PartidaStatusEnum } from '@/api/campeonato/partidas/use-cases/get-partidas/partida-status.enum';
import { GetPartidasTotaisDto } from '@/api/campeonato/partidas/use-cases/get-partidas-totais/get-partidas-totais.dto';

@Injectable()
export class GetPartidasTotaisUseCase {
  constructor(private readonly getPartidasUseCase: GetPartidasUseCase) {}

  async execute(): Promise<GetPartidasTotaisDto> {
    const partidas = await this.getPartidasUseCase.execute({});

    const totalPartidas = partidas.length;
    const totalRealizada = partidas.filter(
      (partida) => partida.status === PartidaStatusEnum.REALIZADA,
    ).length;

    return {
      totalPartidas,
      totalRealizada,
      totalPendente: totalPartidas - totalRealizada,
    };
  }
}
