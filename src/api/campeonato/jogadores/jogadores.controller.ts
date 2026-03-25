import { Controller, Get } from '@nestjs/common';
import { JogadoresService } from './jogadores.service';
import { GetJogadoresDto } from './use-cases/get-jogadores/get-jogadores.dto';

@Controller('campeonato')
export class JogadoresController {
  constructor(private readonly jogadoresService: JogadoresService) {}

  @Get('jogadores')
  getJogadores(): Promise<GetJogadoresDto> {
    return this.jogadoresService.getJogadores();
  }
}
