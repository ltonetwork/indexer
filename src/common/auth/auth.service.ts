import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';

@Injectable()
export class AuthService {
  constructor(private readonly configService: ConfigService) {}

  validateUser(token: string): any {
    const configToken = this.configService.getAuthToken();
    if (configToken) {
      return this.configService.getAuthToken() === token;
    }
    return true;
  }
}
