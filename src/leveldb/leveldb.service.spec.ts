import { Test, TestingModule } from '@nestjs/testing';
import { LevelModuleConfig } from './leveldb.module';
import { LeveldbService } from './leveldb.service';
import { LEVEL } from '../constants';

describe('LevelDbService', () => {
  let module: TestingModule;
  let leveldbService: LeveldbService;

  const imports = (() => {
    const level = jest.fn().mockImplementation(() => ({
      close: jest.fn(),
    }));

    return { level };
  })();

  beforeEach(async () => {
    module = await Test.createTestingModule(LevelModuleConfig)
      .overrideProvider(LEVEL)
      .useValue(imports.level)
      .compile();
    await module.init();

    leveldbService = module.get<LeveldbService>(LeveldbService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('connect()', () => {
    test.skip('should connect to leveldb and store the connection for reuse', async () => {});
  });

  describe('close()', () => {
    test('should close the connection', async () => {
      const first = await leveldbService.connect('fake_path');

      const spyFirst = jest.spyOn(first, 'close');

      await leveldbService.close();

      expect(spyFirst.mock.calls.length).toBe(1);
    });
  });
});
