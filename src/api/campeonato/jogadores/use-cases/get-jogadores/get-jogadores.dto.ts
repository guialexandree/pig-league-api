export interface GetJogadorDto {
  id: number;
  nome: string;
  gols: number;
  partidas: number;
  vitorias: number;
  percentualVitoria: number;
}

export interface GetJogadoresDto {
  grupo: string;
  atualizadoEm: string;
  jogadores: GetJogadorDto[];
}
