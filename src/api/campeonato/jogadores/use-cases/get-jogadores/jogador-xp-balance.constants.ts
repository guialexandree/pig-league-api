export const JogadorXpBalance = {
  temporadaMaxPartidas: 9,
  resultado: {
    vitoria: 18,
    empate: 10,
    derrota: 6,
  },
  golsFeitosMultiplicador: 2,
  golsSofridosPenalidade: 1,
  bonusSaldoVitoria: 6,
  bonusSaldoMinimo: 3,
  xpMinimoPartida: 6,
  tiers: {
    silverMin: 0,
    goldMin: 110,
    heroMin: 170,
  },
} as const;
