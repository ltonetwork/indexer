import { Test, TestingModule } from '@nestjs/testing';
import { AnchorModuleConfig } from './anchor.module';
import { AnchorService } from './anchor.service';
import { AnchorMonitorService } from './anchor-monitor.service';

describe('AnchorService', () => {
  let module: TestingModule;
  let anchorService: AnchorService;
  let monitorService: AnchorMonitorService;

  function spy() {
    const monitor = {
      start: jest.spyOn(monitorService, 'start').mockImplementation(() => { }),
    };

    return { monitor };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(AnchorModuleConfig).compile();
    await module.init();

    anchorService = module.get<AnchorService>(AnchorService);
    monitorService = module.get<AnchorMonitorService>(AnchorMonitorService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('start()', () => {
    test('should start the anchor', async () => {
      const spies = spy();

      await anchorService.start();

      expect(anchorService.started).toBe(true);
      expect(spies.monitor.start.mock.calls.length).toBe(1);
    });
  });
});
