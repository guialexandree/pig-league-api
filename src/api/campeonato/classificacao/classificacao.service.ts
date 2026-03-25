import { Injectable } from '@nestjs/common';
import { GetClassificacaoDto } from './use-cases/get-classificacao/get-classificacao.dto';
import { GetClassificacaoUseCase } from '@/api/campeonato/classificacao/use-cases/get-classificacao/get-classificacao.use-case';
import { LoadClassificacaoFilters } from '@/api/campeonato/classificacao/use-cases/get-classificacao/get-classificacao-filtros.dto';
import { GetClassificacaoGeralUseCase } from '@/api/campeonato/classificacao/use-cases/get-classificacao-geral/get-classificacao-geral.use-case';
import { GetClassificacaoGeralDto } from '@/api/campeonato/classificacao/use-cases/get-classificacao-geral/get-classificacao-geral.dto';
import { LoadClassificacaoGeralFilters } from '@/api/campeonato/classificacao/use-cases/get-classificacao-geral/get-classificacao-geral-filtros.dto';

@Injectable()
export class ClassificacaoService {
  constructor(
    private readonly getClassificacaoUseCase: GetClassificacaoUseCase,
    private readonly getClassificacaoGeralUseCase: GetClassificacaoGeralUseCase,
  ) {}

  async getClassificacao(
    filtros?: LoadClassificacaoFilters,
  ): Promise<GetClassificacaoDto[]> {
    return this.getClassificacaoUseCase.execute(filtros);
  }

  async getClassificacaoGeral(
    filtros?: LoadClassificacaoGeralFilters,
  ): Promise<GetClassificacaoGeralDto[]> {
    return this.getClassificacaoGeralUseCase.execute(filtros);
  }
}
