import { Module } from '@nestjs/common';
import { CampeonatoModule } from './api/campeonato/campeonato.module';
import { GoogleSheetService } from './infra/google-sheet/google-sheet.service';
import { CacheModule } from "@nestjs/cache-manager";

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      ttl: 120000, // 2 min em ms
    }),
    CampeonatoModule,
  ],
})
@Module({
  imports: [CampeonatoModule],
  providers: [GoogleSheetService],
})
export class AppModule {}
