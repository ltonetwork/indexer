import { Test, TestingModule } from '@nestjs/testing';
import { AnchorModuleConfig } from './anchor.module';
import { AnchorMonitorService } from './anchor-monitor.service';
import { AnchorIndexerService } from './anchor-indexer.service';
import { NodeService } from '../node/node.service';
import { StorageService } from '../storage/storage.service';

describe('AnchorService', () => {
  let module: TestingModule;
  let monitorService: AnchorMonitorService;
  let storageService: StorageService;
  let indexerService: AnchorIndexerService;
  let nodeService: NodeService;

  function spy() {
    const monitor = {
      process: jest.spyOn(monitorService, 'process'),
      checkNewBlock: jest.spyOn(monitorService, 'checkNewBlock'),
      processBlock: jest.spyOn(monitorService, 'processBlock'),
      processTransaction: jest.spyOn(monitorService, 'processTransaction'),
    };
    const node = {
      getLastBlockHeight: jest.spyOn(nodeService, 'getLastBlockHeight')
        .mockImplementation(() => 100),
      getBlock: jest.spyOn(nodeService, 'getBlock')
        .mockImplementation(() => ({ height: 100 })),
    };
    const storage = {
      getProcessingHeight: jest.spyOn(storageService, 'getProcessingHeight')
        .mockImplementation(() => 99),
      saveProcessingHeight: jest.spyOn(storageService, 'saveProcessingHeight')
        .mockImplementation(),
      saveAnchor: jest.spyOn(storageService, 'saveAnchor')
        .mockImplementation(),
    };
    const indexer = {
      index: jest.spyOn(indexerService, 'index')
        .mockImplementation(),
    };

    return { monitor, node, storage, indexer };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(AnchorModuleConfig).compile();
    await module.init();

    monitorService = module.get<AnchorMonitorService>(AnchorMonitorService);
    storageService = module.get<StorageService>(StorageService);
    indexerService = module.get<AnchorIndexerService>(AnchorIndexerService);
    nodeService = module.get<NodeService>(NodeService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('start()', () => {
    test('should start the monitor', async () => {
      const spies = spy();
      spies.monitor.process.mockImplementation();

      await monitorService.start();

      expect(spies.monitor.process.mock.calls.length).toBe(1);
    });
  });

  describe('checkNewBlock()', () => {
    test('should check the new blocks', async () => {
      const spies = spy();
      spies.monitor.processBlock.mockImplementation();

      await monitorService.checkNewBlock();

      expect(spies.monitor.processBlock.mock.calls.length).toBe(1);
      expect(spies.monitor.processBlock.mock.calls[0][0]).toEqual({ height: 100 });

      expect(spies.node.getLastBlockHeight.mock.calls.length).toBe(1);
      expect(spies.node.getBlock.mock.calls.length).toBe(1);
      expect(spies.node.getBlock.mock.calls[0][0]).toBe(100);

      expect(spies.storage.getProcessingHeight.mock.calls.length).toBe(1);
      expect(spies.storage.saveProcessingHeight.mock.calls.length).toBe(1);
      expect(spies.storage.saveProcessingHeight.mock.calls[0][0]).toBe(100);
    });
  });

  describe('processBlock()', () => {
    test('should process the block', async () => {
      const spies = spy();
      spies.monitor.processTransaction.mockImplementation();

      const block = {
        height: 100, transactions: [
          { id: 1 },
          { id: 2 },
        ],
      };
      await monitorService.processBlock(block as any);

      expect(spies.monitor.processTransaction.mock.calls.length).toBe(2);
      expect(spies.monitor.processTransaction.mock.calls[0][0]).toEqual(block.transactions[0]);
      expect(spies.monitor.processTransaction.mock.calls[1][0]).toEqual(block.transactions[1]);
    });
  });

  describe('processTransaction()', () => {
    test('should process the transaction', async () => {
      const spies = spy();

      const transaction = {
        id: 'fake_transaction',
        type: 12,
        data: [
          {
            key: monitorService.anchorToken,
            value: '2C26B46B68FFC68FF99B453C1D30413413422D706483BFA0F98A5E886266E7AE',
          },
          {
            key: 'invalid key',
            value: '2C26B46B68FFC68FF99B453C1D30413413422D706483BFA0F98A5E886266E7AEs',
          },
        ],
      };
      await monitorService.processTransaction(transaction as any);

      expect(spies.indexer.index.mock.calls.length).toBe(1);
      expect(spies.indexer.index.mock.calls[0][0]).toEqual(transaction);

      expect(spies.storage.saveAnchor.mock.calls.length).toBe(1);
      expect(spies.storage.saveAnchor.mock.calls[0][0])
        .toBe('d82dba078e81ebc1450baf0517df41e39dc2d43df4e35df8d77e36d83ef4eb8f3704503417df00e44f3ceb6eba13b004');
      expect(spies.storage.saveAnchor.mock.calls[0][1]).toBe('fake_transaction');
    });
  });
});
