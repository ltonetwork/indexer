import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';

describe('AppController', () => {
  let module: TestingModule;
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule],
      controllers: [AppController],
      providers: [AppService],
    }).compile();
    module.init();

    appService = module.get<AppService>(AppService);
    appController = module.get<AppController>(AppController);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('info', () => {
    test('should return application info', async () => {
      const result = { name: 'foo' };
      jest.spyOn(appService, 'info').mockImplementation(() => result);
      expect(await appController.info()).toBe(result);
    });
  });
});
