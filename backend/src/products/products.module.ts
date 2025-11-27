import { Module,forwardRef } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ImagesModule } from '../images/images.module';
import { ModerationModule } from '../moderation/moderation.module';
import { NominatimModule } from '../nominatim/nominatim.module';

@Module({
  imports: [ImagesModule, forwardRef(() => ModerationModule), NominatimModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
