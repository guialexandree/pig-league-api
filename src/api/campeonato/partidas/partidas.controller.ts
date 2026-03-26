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
  @ApiOperation({ summary: 'Buscar partidas por filtros' })
  @ApiOkResponse({ description: 'Lista de partidas' })
  getPartidas(
    @Query() query: GetPartidasFiltrosDto = {},
  ): Promise<GetPartidasDto[]> {
    return this.partidasService.getPartidas(query);
  }

  @Get('partidas-realizadas')
  @ApiOperation({ summary: 'Buscar partidas realizadas por filtros' })
  @ApiOkResponse({ description: 'Lista de partidas realizadas' })
  getPartidasRealizadas(
    @Query() query: GetPartidasFiltrosDto = {},
  ): Promise<GetPartidasDto[]> {
    return this.partidasService.getPartidasRealizadas(query);
  }

  @Get('partidas-pendentes')
  @ApiOperation({ summary: 'Buscar partidas pendentes por filtros' })
  @ApiOkResponse({ description: 'Lista de partidas pendentes' })
  getPartidasPendentes(
    @Query() query: GetPartidasFiltrosDto = {},
  ): Promise<GetPartidasDto[]> {
    return this.partidasService.getPartidasPendentes(query);
  }
}
