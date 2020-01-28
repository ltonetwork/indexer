import { Test, TestingModule } from '@nestjs/testing';
import { AssociationsController } from './associations.controller';
import { AssociationsModuleConfig } from './associations.module';

describe('Associations Controller', () => {
  let module: TestingModule;
  let controller: AssociationsController;

  beforeEach(async () => {
    module = await Test.createTestingModule(AssociationsModuleConfig).compile();

    controller = module.get<AssociationsController>(AssociationsController);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
