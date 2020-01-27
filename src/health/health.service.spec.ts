import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { HealthModuleConfig } from './health.module';

describe('HealthService', () => {
  let module: TestingModule;
  let service: HealthService;

  beforeEach(async () => {
    module = await Test.createTestingModule(HealthModuleConfig).compile();

    service = module.get<HealthService>(HealthService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
