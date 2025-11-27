import { Module } from '@nestjs/common';
import { TestingController } from './testing.controller';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [UsersModule, AuthModule],
  controllers: [TestingController],
})
export class TestingModule {}
