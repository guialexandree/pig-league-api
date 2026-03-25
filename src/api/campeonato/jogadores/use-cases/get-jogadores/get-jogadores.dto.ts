export interface GetJogadorDto {
  id: number;
  nome: string;
}

export interface GetJogadoresDto {
  grupo: string;
  atualizadoEm: string;
  jogadores: GetJogadorDto[];
}
