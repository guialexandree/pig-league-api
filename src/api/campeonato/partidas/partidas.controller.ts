import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { PartidasService } from './partidas.service';
import { GetPartidasDto } from './use-cases/get-partidas/get-partidas.dto';
import { GetPartidasFiltrosDto } from '@/api/campeonato/partidas/use-cases/get-partidas/get-partidas-filtros.dto';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('campeonato')
export class PartidasController {
  constructor(private readonly partidasService: PartidasService) {}

  @Get('partidas')
  @ApiOperation({ summary: 'Buscar produtos por filtros' })
  @ApiOkResponse({ description: 'Lista de produtos' })
  getPartidas(
    @Query() query: GetPartidasFiltrosDto = {},
  ): Promise<GetPartidasDto[]> {
    return this.partidasService.getPartidas(query);
  }
}
