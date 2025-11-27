import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { NominatimModule } from '../nominatim/nominatim.module';

@Module({
  imports: [NominatimModule],
  providers: [UsersService],
  controllers: [UsersController],
  exports:[UsersService]
})
export class UsersModule { }
