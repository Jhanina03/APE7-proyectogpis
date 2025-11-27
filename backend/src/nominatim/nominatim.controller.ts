import { Controller, Get, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { NominatimService, GeocodeResult } from './nominatim.service';

@Controller('nominatim')
export class NominatimController {
  constructor(private readonly nominatimService: NominatimService) {}

  /**
   * Search for address suggestions
   * GET /nominatim/search?q=quito
   */
  @Get('search')
  async searchAddresses(@Query('q') query: string) {
    if (!query) {
      throw new BadRequestException('Query parameter "q" is required');
    }

    if (query.trim().length < 5) {
      throw new BadRequestException('Query must be at least 5 characters');
    }

    const results = await this.nominatimService.searchAddresses(query, 5);
    return results;
  }
}
