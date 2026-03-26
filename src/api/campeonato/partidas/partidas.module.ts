import { Module } from '@nestjs/common';
import { PartidasController } from './partidas.controller';
import { PartidasService } from './partidas.service';
import { GoogleSheetService } from '@/infra/google-sheet/google-sheet.service';
import { GetPartidasUseCase } from '@/api/campeonato/partidas/use-cases/get-partidas/get-partidas.use-case';
import { GetPartidasCsvParser } from '@/api/campeonato/partidas/use-cases/get-partidas/get-partidas-csv.parser';
import { GetPartidasRealizadasUseCase } from '@/api/campeonato/partidas/use-cases/get-partidas-realizadas/get-partidas-realizadas.use-case';

@Module({
  controllers: [PartidasController],
  providers: [
    PartidasService,
    GoogleSheetService,
    GetPartidasUseCase,
    GetPartidasRealizadasUseCase,
    GetPartidasCsvParser,
  ],
  exports: [PartidasService],
})
export class PartidasModule {}
