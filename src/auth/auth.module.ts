import { Module } from '@nestjs/common';
import { ConfigModule } from '../common/config/config.module';
import { AuthService } from './auth.service';
import { HttpStrategy } from './http.strategy';
import { BearerAuthGuard } from './auth.guard';

export const AuthModuleConfig = {
  imports: [ConfigModule],
  providers: [
    AuthService,
    HttpStrategy,
    BearerAuthGuard,
  ],
  exports: [
    AuthService,
    BearerAuthGuard,
  ],
};

@Module(AuthModuleConfig)
export class AuthModule { }
