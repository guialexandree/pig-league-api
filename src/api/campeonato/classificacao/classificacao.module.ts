import { Module } from '@nestjs/common';
import { ClassificacaoController } from './classificacao.controller';
import { ClassificacaoService } from './classificacao.service';
import { GoogleSheetService } from '@/infra/google-sheet/google-sheet.service';
import { GetClassificacaoUseCase } from '@/api/campeonato/classificacao/use-cases/get-classificacao/get-classificacao.use-case';
import { ClassificacaoCsvParser } from '@/api/campeonato/classificacao/use-cases/get-classificacao/get-classificacao-csv.parser';
import { PartidasModule } from '@/api/campeonato/partidas/partidas.module';
import { GetClassificacaoGeralUseCase } from '@/api/campeonato/classificacao/use-cases/get-classificacao-geral/get-classificacao-geral.use-case';

@Module({
  imports: [PartidasModule],
  controllers: [ClassificacaoController],
  providers: [
    ClassificacaoService,
    GoogleSheetService,
    GetClassificacaoUseCase,
    GetClassificacaoGeralUseCase,
    ClassificacaoCsvParser,
  ],
  exports: [ClassificacaoService],
})
export class ClassificacaoModule {}
