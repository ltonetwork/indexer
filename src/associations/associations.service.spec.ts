import { Test, TestingModule } from '@nestjs/testing';
import { AssociationsService } from './associations.service';
import { AssociationsModuleConfig } from './associations.module';

describe('AssociationsService', () => {
  let module: TestingModule;
  let associationsService: AssociationsService;

  beforeEach(async () => {
    module = await Test.createTestingModule(AssociationsModuleConfig).compile();

    associationsService = module.get<AssociationsService>(AssociationsService);
  });

  afterEach(async () => {
    await module.close();
  });

  // @todo: make these tests
  describe('index()', () => {
    test('should index an association (create)', async () => {});
    test('should index a revoke (remove)', async () => {});
    test('should skip if transaction type is not association', async () => {});

    test('should not index if config is set to "none"', async () => {});
    test('should only index trust network addresses if config is set to "trust"', async () => {});
    test('should index all associations if config is set to "all"', async () => {});
  });
});
