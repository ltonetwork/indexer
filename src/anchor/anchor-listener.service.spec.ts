import { Test, TestingModule } from '@nestjs/testing';
import { EmitterService } from '../emitter/emitter.service';
import { AnchorModuleConfig } from './anchor.module';
import { LoggerService } from '../logger/logger.service';
import { AnchorListenerService } from './anchor-listener.service';
import { IndexEventsReturnType } from '../index/index.events';
import { ConfigService } from '../config/config.service';

describe('AnchorListenerService', () => {
  let module: TestingModule;
  let loggerService: LoggerService;
  let configService: ConfigService;
  let emitterService: EmitterService<IndexEventsReturnType>;
  let anchorListenerService: AnchorListenerService;

  function spy() {
    const logger = {
      debug: jest.spyOn(loggerService, 'debug').mockImplementation(() => {}),
    };

    const emitter = {
      on: jest.spyOn(emitterService, 'on').mockImplementation(() => {}),
    };

    const config = {
      getAnchorIndexing: jest.spyOn(configService, 'getAnchorIndexing').mockImplementation(() => 'all'),
    };

    return { logger, emitter, config };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(AnchorModuleConfig).compile();

    loggerService = module.get<LoggerService>(LoggerService);
    configService = module.get<ConfigService>(ConfigService);
    emitterService = module.get<EmitterService<IndexEventsReturnType>>(EmitterService);
    anchorListenerService = module.get<AnchorListenerService>(AnchorListenerService);
  });

  afterEach(async () => {
    await module.close();
  });

  test('should emit event to index emitter', async () => {
    const spies = spy();

    anchorListenerService.onModuleInit();

    expect(spies.config.getAnchorIndexing.mock.calls.length).toBe(1);
    expect(spies.emitter.on.mock.calls.length).toBe(2);
  });

  test('should not emit event if anchor indexing is set to `none`', async () => {
    const spies = spy();

    spies.config.getAnchorIndexing.mockImplementation(() => 'none');

    anchorListenerService.onModuleInit();

    expect(spies.config.getAnchorIndexing.mock.calls.length).toBe(1);
    expect(spies.logger.debug.mock.calls.length).toBe(1);
    expect(spies.logger.debug.mock.calls[0][0])
        .toBe(`transaction-listener: Not processing anchor: config set to "none"`);
    expect(spies.emitter.on.mock.calls.length).toBe(0);
  });
});
