import { Test, TestingModule } from '@nestjs/testing';
import { AssociationsService } from './associations.service';
import { AssociationsModuleConfig } from './associations.module';

describe('AssociationsService', () => {
  let module: TestingModule;
  let service: AssociationsService;

  beforeEach(async () => {
    module = await Test.createTestingModule(AssociationsModuleConfig).compile();

    service = module.get<AssociationsService>(AssociationsService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
