import { Module } from '@nestjs/common';
import { CampeonatoModule } from './api/campeonato/campeonato.module';
import { GoogleSheetService } from './infra/google-sheet/google-sheet.service';

@Module({
  imports: [CampeonatoModule],
  providers: [GoogleSheetService],
})
export class AppModule {}
