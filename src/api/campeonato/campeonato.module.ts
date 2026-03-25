import { Module } from '@nestjs/common';
import { ClassificacaoModule } from './classificacao/classificacao.module';
import { PartidasModule } from './partidas/partidas.module';
import { JogadoresModule } from './jogadores/jogadores.module';

@Module({
  imports: [ClassificacaoModule, PartidasModule, JogadoresModule],
})
export class CampeonatoModule {}
