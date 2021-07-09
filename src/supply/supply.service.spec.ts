import { Test, TestingModule } from '@nestjs/testing';
import { SupplyModuleConfig } from './supply.module';
import { SupplyService } from './supply.service';

describe('SupplyService', () => {
  let module: TestingModule;
  let supplyService: SupplyService;

  beforeEach(async () => {
    module = await Test.createTestingModule(SupplyModuleConfig).compile();
    await module.init();

    supplyService = module.get<SupplyService>(SupplyService);
  });

  afterEach(async () => {
    await module.close();
  });

  // @todo: make tests
  test('example test', () => {
    expect(true).toBe(true);
  });
});
