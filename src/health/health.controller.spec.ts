import { Test, TestingModule } from '@nestjs/testing';
import { HealthModuleConfig } from './health.module';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let module: TestingModule;
  let controller: HealthController;

  beforeEach(async () => {
    module = await Test.createTestingModule(HealthModuleConfig).compile();

    controller = module.get<HealthController>(HealthController);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
