export interface GetClassificacaoJogadorDto {
  posicao: number;
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

export interface GetClassificacaoDto {
  grupo: string;
  atualizadoEm: string;
  classificacao: GetClassificacaoJogadorDto[];
}
