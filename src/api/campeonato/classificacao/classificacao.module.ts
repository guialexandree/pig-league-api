import { Module } from '@nestjs/common';
import { ClassificacaoController } from './classificacao.controller';
import { ClassificacaoService } from './classificacao.service';
import { GoogleSheetService } from '@/infra/google-sheet/google-sheet.service';
import { GetClassificacaoUseCase } from '@/api/campeonato/classificacao/use-cases/get-classificacao/get-classificacao.use-case';
import { ClassificacaoCsvParser } from '@/api/campeonato/classificacao/use-cases/get-classificacao/get-classificacao-csv.parser';

@Module({
  controllers: [ClassificacaoController],
  providers: [
    ClassificacaoService,
    GoogleSheetService,
    GetClassificacaoUseCase,
    ClassificacaoCsvParser,
  ],
  exports: [ClassificacaoService],
})
export class ClassificacaoModule {}
