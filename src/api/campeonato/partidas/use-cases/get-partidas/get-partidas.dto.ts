import { PartidaStatusEnum } from './partida-status.enum';

export interface GetPartidaItemDto {
  grupo: string;
  mandante: string;
  golsMandante: number | null;
  golsVisitante: number | null;
  visitante: string;
  status: PartidaStatusEnum;
}

export interface GetPartidasDto {
  grupo: string;
  atualizadoEm: string;
  partidas: GetPartidaItemDto[];
}
