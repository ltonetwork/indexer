import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {ConfigService} from '../config/config.service';

@Injectable()
export class BearerAuthGuard extends AuthGuard('bearer') {
  constructor(options, private readonly configService: ConfigService){
    super(options);
  }

  handleRequest(err, user, info) {
    if (this.configService.getAuthToken()) {
      if (err || !user) {
        throw err || new UnauthorizedException();
      }
      return user;
    }

    return true;
  }
}
