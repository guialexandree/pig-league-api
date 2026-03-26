import { JogadorTierEnum } from './jogador-tier.enum';

export interface GetJogadorDto {
  id: number;
  nome: string;
  gols: number;
  partidas: number;
  vitorias: number;
  percentualVitoria: number;
  xp: number;
  tier: JogadorTierEnum;
  xpAtualNoTier: number;
  xpNecessarioProximoTier: number;
  progressoProximoTierPercentual: number;
}

export interface GetJogadoresDto {
  grupo: string;
  atualizadoEm: string;
  jogadores: GetJogadorDto[];
}
