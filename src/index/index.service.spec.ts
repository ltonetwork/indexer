import { Test, TestingModule } from '@nestjs/testing';
import { IndexService } from './index.service';
import { IndexModuleConfig } from './index.module';
import { EmitterService } from '../emitter/emitter.service';
import { IndexEventsReturnType } from './index.events';

describe('IndexService', () => {
  let module: TestingModule;
  let indexService: IndexService;
  let emitterService: EmitterService<IndexEventsReturnType>;

  function spy() {
    const indexer = {
      index: jest.spyOn(indexService, 'indexTx'),
    };

    const emitter = {
      emit: jest.spyOn(emitterService, 'emit'),
    };

    return { indexer, emitter };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(IndexModuleConfig).compile();
    await module.init();

    indexService = module.get<IndexService>(IndexService);
    emitterService = module.get<EmitterService<IndexEventsReturnType>>(EmitterService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(indexService).toBeDefined();
  });

  describe('index()', () => {
    beforeEach(() => {
      indexService.lastBlock = {
        height: 1,
        burnedFees: 0,
        timestamp: 1,
        generator: '2s',
        generatorReward: 0,
        transactionCount: 0,
        transactions: [],
      };
    });

    test('should ignore genesis transactions', async () => {
      const spies = spy();

      const transaction = { id: 'fake_transaction', type: 1, sender: 'fake_sender' };
      await indexService.indexTx({ transaction: transaction as any, blockHeight: 1, position: 0});

      expect(spies.emitter.emit.mock.calls.length).toBe(1);
      expect(spies.emitter.emit.mock.calls[0][0]).toBe('IndexTransaction');
    });

    test('should index the anchor transaction', async () => {
      const spies = spy();

      const transaction = {id: 'fake_transaction', type: 15, sender: 'fake_sender'};
      await indexService.indexTx({transaction: transaction as any, blockHeight: 1, position: 0});

      expect(spies.emitter.emit.mock.calls.length).toBe(1);
    });

    test('should skip index if an tx is indexed twice', async () => {
      const spies = spy();

      indexService.txCache.push('fake_transaction');

      const transaction = {id: 'fake_transaction', type: 15, sender: 'fake_sender'};
      await indexService.indexTx({transaction: transaction as any, blockHeight: 1, position: 0});

      expect(spies.emitter.emit.mock.calls.length).toBe(0);
    });
  });
});
