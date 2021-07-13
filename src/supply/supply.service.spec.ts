import { Test, TestingModule } from '@nestjs/testing';
import { NodeService, ActivationStatus } from '../node/node.service';
import { StorageService } from '../storage/storage.service';
import { SupplyModuleConfig } from './supply.module';
import { SupplyService } from './supply.service';

describe('SupplyService', () => {
  let module: TestingModule;
  let nodeService: NodeService;
  let supplyService: SupplyService;
  let storageService: StorageService;

  beforeEach(async () => {
    module = await Test.createTestingModule(SupplyModuleConfig).compile();
    await module.init();

    nodeService = module.get<NodeService>(NodeService);
    supplyService = module.get<SupplyService>(SupplyService);
    storageService = module.get<StorageService>(StorageService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('transaction fee burn', () => {
    describe('incrTxFeeBurned()', () => {
      let setTxFeeBurned, getTxFeeBurned, activationStatus;

      beforeEach(() => {
        setTxFeeBurned = jest.spyOn(storageService, 'setTxFeeBurned').mockImplementation(async () => {});
        getTxFeeBurned = jest.spyOn(storageService, 'getTxFeeBurned').mockImplementation(async () => 10);
        activationStatus = jest.spyOn(nodeService, 'getActivationStatus').mockImplementation(async () => {
          return {
            features: [{
              id: 12,
              activationHeight: 1
            }]
          } as ActivationStatus;
        });
      });

      test('should increase the tx fee burned index', async () => {  
        await supplyService.incrTxFeeBurned(5);
  
        expect(activationStatus.mock.calls.length).toBe(1);

        expect(getTxFeeBurned.mock.calls.length).toBe(1);

        expect(setTxFeeBurned.mock.calls.length).toBe(1);
        expect(setTxFeeBurned.mock.calls[0][0]).toBe('10.1');
      });

      test('should not increase if activation status throws an error', async () => {
        activationStatus = jest.spyOn(nodeService, 'getActivationStatus').mockRejectedValue(async () => {});

        await supplyService.incrTxFeeBurned(5);
  
        expect(activationStatus.mock.calls.length).toBe(1);
        expect(getTxFeeBurned.mock.calls.length).toBe(0);
        expect(setTxFeeBurned.mock.calls.length).toBe(0);
      });

      test('should not increase if burn feature was not found', async () => {
        activationStatus = jest.spyOn(nodeService, 'getActivationStatus').mockImplementation(async () => {
          return {
            features: [{
              id: 10,
              activationHeight: 1
            }]
          } as ActivationStatus;
        });

        await supplyService.incrTxFeeBurned(5);
  
        expect(activationStatus.mock.calls.length).toBe(1);
        expect(getTxFeeBurned.mock.calls.length).toBe(0);
        expect(setTxFeeBurned.mock.calls.length).toBe(0);
      });

      test('should not increase if block height is lower than feature activation', async () => {
        activationStatus = jest.spyOn(nodeService, 'getActivationStatus').mockImplementation(async () => {
          return {
            features: [{
              id: 12,
              activationHeight: 10
            }]
          } as ActivationStatus;
        });

        await supplyService.incrTxFeeBurned(5);
  
        expect(activationStatus.mock.calls.length).toBe(1);
        expect(getTxFeeBurned.mock.calls.length).toBe(0);
        expect(setTxFeeBurned.mock.calls.length).toBe(0);
      });

      test('should not throw error if key does not exist on database (getTxFeeBurned throws)', async () => {
        getTxFeeBurned = jest.spyOn(storageService, 'getTxFeeBurned').mockRejectedValue(async () => {});

        await expect(supplyService.incrTxFeeBurned(5)).resolves.not.toThrow();

        expect(activationStatus.mock.calls.length).toBe(1);
        expect(getTxFeeBurned.mock.calls.length).toBe(1);
        expect(setTxFeeBurned.mock.calls.length).toBe(0);
      });
    });

    describe('getTxFeeBurned()', () => {
      test('should return the transaction fee burned value', async () => {
        const getTxFeeBurned = jest.spyOn(storageService, 'getTxFeeBurned').mockImplementation(async () => 10);

        const result = await supplyService.getTxFeeBurned();

        expect(getTxFeeBurned.mock.calls.length).toBe(1);

        expect(result).toBe(10);
      });
    });

    // @todo: tests
    describe('getFeeBurnFeatureHeight()', () => {});
    describe('isFeatureActivated()', () => {});
  });

  describe('circulating supply', () => {
    describe('getCirculatingSupply()', () => {});
  });
});
