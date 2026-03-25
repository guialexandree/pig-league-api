import { Controller, Get, Query } from '@nestjs/common';
import { ClassificacaoService } from './classificacao.service';
import { GetClassificacaoDto } from './use-cases/get-classificacao/get-classificacao.dto';
import { LoadClassificacaoFilters } from '@/api/campeonato/classificacao/use-cases/get-classificacao/get-classificacao-filtros.dto';

@Controller('campeonato')
export class ClassificacaoController {
  constructor(private readonly classificacaoService: ClassificacaoService) {}

  @Get('classificacao')
  getClassificacao(
    @Query() query: LoadClassificacaoFilters,
  ): Promise<GetClassificacaoDto> {
    return this.classificacaoService.getClassificacao(query);
  }
}
