import { Test, TestingModule } from '@nestjs/testing';
import { EmitterService } from '../emitter/emitter.service';
import { AssociationsModuleConfig } from './associations.module';
import { LoggerService } from '../logger/logger.service';
import { AssociationsListenerService } from './associations-listener.service';
import { IndexEventsReturnType } from '../index/index.events';
import { ConfigService } from '../config/config.service';

describe('AssociationsListenerService', () => {
  let module: TestingModule;
  let loggerService: LoggerService;
  let configService: ConfigService;
  let emitterService: EmitterService<IndexEventsReturnType>;
  let associationsListenerService: AssociationsListenerService;

  function spy() {
    const logger = {
      debug: jest.spyOn(loggerService, 'debug').mockImplementation(() => {}),
    };

    const emitter = {
      on: jest.spyOn(emitterService, 'on').mockImplementation(() => {}),
    };

    const config = {
      getAssociationIndexing: jest.spyOn(configService, 'getAssociationIndexing').mockImplementation(() => 'all'),
    };

    return { logger, emitter, config };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(AssociationsModuleConfig).compile();

    loggerService = module.get<LoggerService>(LoggerService);
    configService = module.get<ConfigService>(ConfigService);
    emitterService = module.get<EmitterService<IndexEventsReturnType>>(EmitterService);
    associationsListenerService = module.get<AssociationsListenerService>(AssociationsListenerService);
  });

  afterEach(async () => {
    await module.close();
  });

  test('should emit event to index emitter', async () => {
    const spies = spy();

    associationsListenerService.onModuleInit();

    expect(spies.config.getAssociationIndexing.mock.calls.length).toBe(1);
    expect(spies.emitter.on.mock.calls.length).toBe(1);
  });

  test('should not emit event if associations indexing is set to `none`', async () => {
    const spies = spy();

    spies.config.getAssociationIndexing.mockImplementation(() => 'none');

    associationsListenerService.onModuleInit();

    expect(spies.config.getAssociationIndexing.mock.calls.length).toBe(1);
    expect(spies.logger.debug.mock.calls.length).toBe(1);
    expect(spies.logger.debug.mock.calls[0][0]).toBe(`transaction-listener: Not processing associations: config set to "none"`);
    expect(spies.emitter.on.mock.calls.length).toBe(0);
  });
});
