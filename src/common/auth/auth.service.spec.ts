import { Test, TestingModule } from '@nestjs/testing';
import { AuthModuleConfig } from './auth.module';
import { AuthService } from './auth.service';
import { ConfigService } from '../config/config.service';

describe('AuthService', () => {
  let module: TestingModule;
  let authService: AuthService;
  let configService: ConfigService;

  beforeEach(async () => {
    module = await Test.createTestingModule(AuthModuleConfig).compile();
    await module.init();

    authService = module.get<AuthService>(AuthService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('validateUser()', () => {
    test('should return true if a token is correct', () => {
      const token = '8DeKltC3dOjTNlv1EbXjCYIsOhypz4u245LypJeSdu5lES33VnqI3sy5OznLuA4x';

      jest.spyOn(configService, 'getAuthToken').mockImplementation(() => token);
      expect(authService.validateUser(token)).toBeTruthy();
    });

    test('should return false if a token is incorrect', () => {
      const token = '8DeKltC3dOjTNlv1EbXjCYIsOhypz4u245LypJeSdu5lES33VnqI3sy5OznLuA4x';

      jest.spyOn(configService, 'getAuthToken').mockImplementation(() => token);
      expect(authService.validateUser('test')).toBeFalsy();
    });

    test('should return true if no token is configured', () => {
      expect(authService.validateUser('test')).toBeTruthy();
    });
  });
});
