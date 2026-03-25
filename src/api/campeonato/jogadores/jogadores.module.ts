import { Module } from '@nestjs/common';
import { JogadoresController } from './jogadores.controller';
import { JogadoresService } from './jogadores.service';
import { GoogleSheetService } from '@/infra/google-sheet/google-sheet.service';
import { GetJogadoresUseCase } from '@/api/campeonato/jogadores/use-cases/get-jogadores/get-jogadores.use-case';
import { GetJogadoresCsvParser } from '@/api/campeonato/jogadores/use-cases/get-jogadores/get-jogadores-csv.parser';
import { PartidasModule } from '@/api/campeonato/partidas/partidas.module';

@Module({
  imports: [PartidasModule],
  controllers: [JogadoresController],
  providers: [
    JogadoresService,
    GoogleSheetService,
    GetJogadoresUseCase,
    GetJogadoresCsvParser,
  ],
  exports: [JogadoresService],
})
export class JogadoresModule {}
