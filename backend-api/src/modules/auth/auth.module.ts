import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FirebaseStrategy } from './firebase.strategy';

@Module({
  controllers: [AuthController],
  providers: [AuthService, FirebaseStrategy],
  exports: [AuthService, FirebaseStrategy],
})
export class AuthModule {}
