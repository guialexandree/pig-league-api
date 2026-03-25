import { Controller, Get } from '@nestjs/common';
import { JogadoresService } from './jogadores.service';
import { GetJogadoresDto } from './use-cases/get-jogadores/get-jogadores.dto';

@Controller('jogadores')
export class JogadoresController {
  constructor(private readonly jogadoresService: JogadoresService) {}

  @Get()
  getJogadores(): Promise<GetJogadoresDto> {
    return this.jogadoresService.getJogadores();
  }
}
