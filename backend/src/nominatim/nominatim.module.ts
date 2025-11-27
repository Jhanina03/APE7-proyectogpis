import { Module } from '@nestjs/common';
import { NominatimService } from './nominatim.service';
import { NominatimController } from './nominatim.controller';

@Module({
  controllers: [NominatimController],
  providers: [NominatimService],
  exports: [NominatimService],
})
export class NominatimModule {}
