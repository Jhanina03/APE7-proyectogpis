import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProductsModule } from './products/products.module';
import { ImagesModule } from './images/images.module';
import { ModerationModule } from './moderation/moderation.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { MailerModule } from './mailer/mailer.module';
import { NominatimModule } from './nominatim/nominatim.module';
import { TestingModule } from './test/testing.module';
import { HealthController } from './health/health.controller';

const isTest = process.env.NODE_ENV === 'test';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ProductsModule,
    ImagesModule,
    ModerationModule,
    AuthModule,
    UsersModule,
    PrismaModule,
    MailerModule,
    NominatimModule,
    ...(isTest ? [TestingModule] : []),
  ],
  controllers:[HealthController]
})
export class AppModule { }
