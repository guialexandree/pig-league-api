import { Injectable } from '@nestjs/common';
import { GetJogadoresUseCase } from '@/api/campeonato/jogadores/use-cases/get-jogadores/get-jogadores.use-case';
import { GetJogadoresDto } from '@/api/campeonato/jogadores/use-cases/get-jogadores/get-jogadores.dto';

@Injectable()
export class JogadoresService {
  constructor(private readonly getJogadoresUseCase: GetJogadoresUseCase) {}

  async getJogadores(): Promise<GetJogadoresDto> {
    return this.getJogadoresUseCase.execute();
  }
}
