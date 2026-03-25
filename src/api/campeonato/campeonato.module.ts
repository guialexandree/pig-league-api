import { Module } from '@nestjs/common';
import { ClassificacaoModule } from './classificacao/classificacao.module';
import { PartidasModule } from './partidas/partidas.module';

@Module({
  imports: [ClassificacaoModule, PartidasModule],
})
export class CampeonatoModule {}
