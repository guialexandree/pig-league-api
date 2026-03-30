import { ClassificacaoStatusFaseEnum } from './classificacao-status-fase.enum';

export interface GetClassificacaoGeralDto {
  grupo: string;
  posicao: number;
  statusFase?: ClassificacaoStatusFaseEnum;
  jogador: string;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  golsPositivo: number;
  golsContra: number;
  saldoGols: number;
  pontos: number;
}
