export interface ClassificacaoItemDto {
  posicao: number;
  jogador: string;
  j: number;
  v: number;
  e: number;
  d: number;
  gp: number;
  gc: number;
  sg: number;
  pts: number;
}

export interface ClassificacaoResponseDto {
  grupo: string;
  atualizadoEm: string;
  classificacao: ClassificacaoItemDto[];
}
