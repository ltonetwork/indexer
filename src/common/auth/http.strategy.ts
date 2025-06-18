import { Strategy } from 'passport-http-bearer';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class HttpStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super();
  }

  validate(token: string) {
    if (!this.authService.validateUser(token)) {
      throw new UnauthorizedException();
    }
    return { id: 'admin' };
  }
}
