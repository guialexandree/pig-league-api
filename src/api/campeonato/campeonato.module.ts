import { Module } from '@nestjs/common';
import { ClassificacaoModule } from './classificacao/classificacao.module';

@Module({
  imports: [ClassificacaoModule],
})
export class CampeonatoModule {}
