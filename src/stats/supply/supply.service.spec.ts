import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { NodeService, ActivationStatus } from '../../node/node.service';
import { RequestService } from '../../common/request/request.service';
import { StorageService } from '../../storage/storage.service';
import { StatsModuleConfig } from '../stats.module';
import { SupplyService } from './supply.service';

describe('SupplyService', () => {
  let module: TestingModule;
  let nodeService: NodeService;
  let supplyService: SupplyService;
  let storageService: StorageService;
  let requestService: RequestService;

  beforeEach(async () => {
    module = await Test.createTestingModule(StatsModuleConfig).compile();
    await module.init();

    nodeService = module.get<NodeService>(NodeService);
    supplyService = module.get<SupplyService>(SupplyService);
    storageService = module.get<StorageService>(StorageService);
    requestService = module.get<RequestService>(RequestService);

    // january 2021 = 294114776 (see locked-supply.data.json)
    jest.spyOn(Date, 'now').mockImplementation(() => new Date('2021-01-01T13:13:37.000Z').valueOf());
  });

  afterEach(async () => {
    await module.close();
  });

  describe('transaction fee burn', () => {
    describe('incrTxFeeBurned()', () => {
      test('should increase the tx fee burned index', async () => {
        const incrTxFeeBurned = jest.spyOn(storageService, 'incrTxFeeBurned').mockImplementation(async () => {});

        await supplyService.incrTxFeeBurned(5);

        expect(incrTxFeeBurned.mock.calls.length).toBe(1);
        expect(incrTxFeeBurned.mock.calls[0][0]).toBe(5);
      });
    });

    describe('getTxFeeBurned()', () => {
      test('should return the transaction fee burned from storage', async () => {
        const getTxFeeBurned = jest.spyOn(storageService, 'getTxFeeBurned').mockImplementation(async () => 10);

        const result = await supplyService.getTxFeeBurned();

        expect(getTxFeeBurned.mock.calls.length).toBe(1);

        expect(result).toBe(10);
      });
    });
  });

  describe('getCirculatingSupply()', () => {
    let getTxFeeBurned: jest.SpyInstance<Promise<number>>;
    let httpGet: jest.SpyInstance<Promise<AxiosResponse | Error>>;

    beforeEach(() => {
      getTxFeeBurned = jest.spyOn(storageService, 'getTxFeeBurned').mockImplementation(async () => 100000000);
      httpGet = jest.spyOn(requestService, 'get').mockImplementation(async () => {
        return {
          data: {
            volume: {
              lto: { supply: 500000000 },
              lto20: { supply: 100000000 },
              binance: { supply: 100000000 },
            },
          },
        } as AxiosResponse;
      });
    });

    test('should calculate the result correctly with 8 decimal places', async () => {
      const result = await supplyService.getCirculatingSupply();

      expect(httpGet.mock.calls.length).toBe(1);
      expect(httpGet.mock.calls[0][0]).toBe('https://bridge.lto.network/stats');

      expect(getTxFeeBurned.mock.calls.length).toBe(1);

      expect(result).toBe('305885224.00000000');
    });

    test('should reject if bridge stats request fails', async () => {
      httpGet = jest.spyOn(requestService, 'get').mockRejectedValue('some error');

      await supplyService.getCirculatingSupply().catch(error => {
        expect(error).toBe('some error');
      });
    });
  });

  describe('getMaxSupply()', () => {
    let httpGet: jest.SpyInstance<Promise<AxiosResponse | Error>>;

    beforeEach(() => {
      httpGet = jest.spyOn(requestService, 'get').mockImplementation(async () => {
        return {
          data: {
            volume: {
              lto: { supply: 500000000 },
              lto20: { supply: 100000000 },
              binance: { supply: 100000000 }
            }
          }
        } as AxiosResponse;
      });
    });

    test('should calculate the result correctly with 8 decimal places', async () => {
      const result = await supplyService.getMaxSupply();

      expect(httpGet.mock.calls.length).toBe(1);
      expect(httpGet.mock.calls[0][0]).toBe('https://bridge.lto.network/stats');

      expect(result).toBe('700000000.00000000');
    });

    test('should reject if bridge stats request fails', async () => {
      httpGet = jest.spyOn(requestService, 'get').mockRejectedValue('some error');

      await supplyService.getMaxSupply().catch(error => {
        expect(error).toBe('some error');
      });
    });
  });
});
