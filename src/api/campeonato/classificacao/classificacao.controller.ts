import { Controller, Get } from '@nestjs/common';
import { ClassificacaoService } from './classificacao.service';
import { ClassificacaoResponseDto } from './dto/classificacao-response.dto';

@Controller('campeonato')
export class ClassificacaoController {
  constructor(private readonly classificacaoService: ClassificacaoService) {}

  @Get('classificacao')
  getClassificacao(): Promise<ClassificacaoResponseDto> {
    return this.classificacaoService.getClassificacao();
  }
}
