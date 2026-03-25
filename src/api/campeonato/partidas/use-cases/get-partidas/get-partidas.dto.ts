import { PartidaStatusEnum } from './partida-status.enum';

export interface GetPartidasDto {
  grupo: string;
  dataHora: string | null;
  mandante: string;
  golsMandante: number | null;
  golsVisitante: number | null;
  visitante: string;
  status: PartidaStatusEnum;
}
