import { Injectable } from '@nestjs/common';
import { GetClassificacaoDto } from './use-cases/get-classificacao/get-classificacao.dto';
import { GetClassificacaoUseCase } from '@/api/campeonato/classificacao/use-cases/get-classificacao/get-classificacao.use-case';
import { LoadClassificacaoFilters } from '@/api/campeonato/classificacao/use-cases/get-classificacao/get-classificacao-filtros.dto';

@Injectable()
export class ClassificacaoService {
  constructor(
    private readonly getClassificacaoUseCase: GetClassificacaoUseCase,
  ) {}

  async getClassificacao(
    filtros?: LoadClassificacaoFilters,
  ): Promise<GetClassificacaoDto> {
    return this.getClassificacaoUseCase.execute(filtros);
  }
}
