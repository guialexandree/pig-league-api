import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { CampeonatoModule } from './api/campeonato/campeonato.module';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      ttl: 120000,
    }),
    CampeonatoModule,
  ],
})
export class AppModule {}
