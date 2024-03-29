import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from '../common/redis/redis.service';
import { StorageModuleConfig } from './storage.module';
import { StorageService } from './storage.service';
import { ConfigService } from '../common/config/config.service';
import { RedisStorageService } from './redis/redis.storage.service';
import { VerificationMethod } from '../did/verification-method/verification-method.model';
import { StorageTypeEnum } from '../common/config/enums/storage.type.enum';
import { RedisGraphService } from './redis/redis-graph.service';

describe('StorageService', () => {
  let module: TestingModule;
  let storageService: StorageService;
  let redisStorageService: RedisStorageService;
  let redisService: RedisService;
  let configService: ConfigService;
  let redisGraphService: RedisGraphService;

  function spy() {
    const redisConnection = {
      quit: jest.fn(),
    };

    const redis = {
      connect: jest.spyOn(redisService, 'connect').mockImplementation(async () => redisConnection as any),
    };

    return { redis, redisConnection };
  }

  async function initModule(options: { graphEnabled: boolean }) {
    module = await Test.createTestingModule(StorageModuleConfig).compile();

    storageService = module.get<StorageService>(StorageService);
    redisStorageService = module.get<RedisStorageService>(RedisStorageService);
    redisService = module.get<RedisService>(RedisService);
    configService = module.get<ConfigService>(ConfigService);
    redisGraphService = module.get<RedisGraphService>(RedisGraphService);

    jest.spyOn(configService, 'isAssociationGraphEnabled').mockImplementation(() => options.graphEnabled);
    jest.spyOn(configService, 'getStorageType').mockImplementation(() => StorageTypeEnum.Redis);

    await module.init();

    spy();
  }

  afterEach(async () => {
    await module.close();
  });

  describe('with graph disabled', () => {
    beforeEach(async () => {
      await initModule({ graphEnabled: false });
    });

    describe('saveAnchor()', () => {
      test('should save the anchor', async () => {
        const addObject = jest.spyOn(redisStorageService, 'addObject').mockImplementation(() => Promise.resolve());

        const hash = '2C26B46B68FFC68FF99B453C1D30413413422D706483BFA0F98A5E886266E7AE';

        const transaction = {
          id: 'fake_transaction',
          block: '1',
          position: '10',
        };

        await storageService.saveAnchor(hash, transaction);

        expect(addObject.mock.calls.length).toBe(1);
        expect(addObject.mock.calls[0][0]).toBe(`lto:anchor:${hash.toLowerCase()}`);
        expect(addObject.mock.calls[0][1]).toEqual(transaction);
      });
    });

    describe('getAnchor()', () => {
      test('should get the anchor from database', async () => {
        const getObject = jest
          .spyOn(redisStorageService, 'getObject')
          .mockImplementation(() => Promise.resolve({ some: 'data' }));

        const result = await storageService.getAnchor('some-anchor');

        expect(getObject).toHaveBeenCalledTimes(1);
        expect(getObject).toHaveBeenCalledWith('lto:anchor:some-anchor');
        expect(result).toEqual({ some: 'data' });
      });

      // test('should catch when key not found in database and return null', async () => {
      //   const getObject = jest
      //     .spyOn(redisStorageService, 'getObject')
      //     .mockImplementation(() =>
      //       Promise.reject(
      //         new Error(
      //           'NotFoundError: Key not found in database [lto:anchor:some-anchor]',
      //         ),
      //       ),
      //     );

      //   const result = await storageService.getAnchor('some-anchor');

      //   expect(getObject).toHaveBeenCalledTimes(1);
      //   expect(getObject).toHaveBeenCalledWith('lto:anchor:some-anchor');
      //   expect(result).toEqual(null);
      // });

      // test('should rethrow errors other than key not found', async () => {
      //   const getObject = jest
      //     .spyOn(redisStorageService, 'getObject')
      //     .mockImplementation(() =>
      //       Promise.reject(new Error('some other error here!')),
      //     );

      //   try {
      //     await storageService.getAnchor('some-anchor');
      //   } catch (error) {
      //     expect(error).toEqual(new Error('some other error here!'));
      //     expect(getObject).toHaveBeenCalledTimes(1);
      //     expect(getObject).toHaveBeenCalledWith('lto:anchor:some-anchor');
      //   }
      // });
    });

    describe('saveMappedAnchor()', () => {
      test('should save the anchor', async () => {
        const addToSet = jest.spyOn(redisStorageService, 'addToSet').mockImplementation(() => Promise.resolve());
        const addObject = jest.spyOn(redisStorageService, 'addObject').mockImplementation(() => Promise.resolve());

        const key = 'C9ED6179884278AF4E0D91286E52B688EF5B6998AF5E33D7E574DA3A719CA3D8';
        const hash = '2C26B46B68FFC68FF99B453C1D30413413422D706483BFA0F98A5E886266E7AE';

        const transaction = {
          hash,
          id: 'fake_transaction',
          sender: '3NCEKjExpsxzyJpLutF8U9uVDiKu8oStn68',
          block: '1',
          position: '10',
        };

        await storageService.saveMappedAnchor(key, transaction.hash, transaction);

        expect(addToSet.mock.calls.length).toBe(1);
        expect(addToSet.mock.calls[0][0]).toBe(`lto:mapped-anchor:${key.toLowerCase()}`);
        expect(addToSet.mock.calls[0][1]).toBe(hash);

        expect(addObject.mock.calls.length).toBe(1);
        expect(addObject.mock.calls[0][0]).toBe(`lto:mapped-anchor:${key.toLowerCase()}:${hash.toLowerCase()}`);
        expect(addObject.mock.calls[0][1]).toEqual(transaction);
      });
    });

    describe('getMappedAnchor()', () => {
      test('should get the anchor from database', async () => {
        const getObject = jest
          .spyOn(redisStorageService, 'getObject')
          .mockImplementation(() => Promise.resolve({ some: 'data' }));

        const result = await storageService.getMappedAnchor('some-key', 'some-value');

        expect(getObject).toHaveBeenCalledTimes(1);
        expect(getObject).toHaveBeenCalledWith('lto:mapped-anchor:some-key:some-value');
        expect(result).toEqual({ some: 'data' });
      });
    });

    describe('indexTx()', () => {
      test('should index transaction type for address', async () => {
        const transaction = 'fake_transaction';
        const addToSortedSet = jest
          .spyOn(redisStorageService, 'addToSortedSet')
          .mockImplementation(() => Promise.resolve());

        const type = 'anchor';
        const address = 'fake_address_WITH_CAPS';
        const timestamp = 1;
        await storageService.indexTx(type, address, transaction, timestamp);

        expect(addToSortedSet.mock.calls.length).toBe(1);
        expect(addToSortedSet.mock.calls[0][0]).toBe(`lto:tx:${type}:${address}`);
        expect(addToSortedSet.mock.calls[0][1]).toBe(transaction);
        expect(addToSortedSet.mock.calls[0][2]).toBe(timestamp);
      });
    });

    describe('getTx()', () => {
      test('should get transaction type for address', async () => {
        const transactions = ['fake_transaction'];
        const getSortedSet = jest
          .spyOn(redisStorageService, 'getSortedSet')
          .mockImplementation(async () => transactions);

        const type = 'anchor';
        const address = 'fake_address';
        const limit = 25;
        const offset = 0;
        expect(await storageService.getTx(type, address, limit, offset)).toEqual(transactions);

        expect(getSortedSet.mock.calls.length).toBe(1);
        expect(getSortedSet.mock.calls[0][0]).toBe(`lto:tx:${type}:${address}`);
        expect(getSortedSet.mock.calls[0][1]).toBe(limit);
        expect(getSortedSet.mock.calls[0][2]).toBe(offset);
      });
    });

    describe('countTx()', () => {
      test('should count transaction type for address', async () => {
        const countSortedSet = jest.spyOn(redisStorageService, 'countSortedSet').mockImplementation(async () => 3);

        const type = 'anchor';
        const address = 'fake_address';
        expect(await storageService.countTx(type, address)).toEqual(3);

        expect(countSortedSet.mock.calls.length).toBe(1);
        expect(countSortedSet.mock.calls[0][0]).toBe(`lto:tx:${type}:${address}`);
      });
    });

    describe('incrTxStats()', () => {
      test('should increment stats for transaction type', async () => {
        const incrValue = jest.spyOn(redisStorageService, 'incrValue').mockResolvedValue(undefined);

        const type = 'anchor';
        const day = 18600;
        await storageService.incrTxStats(type, day);

        expect(incrValue.mock.calls.length).toBe(1);
        expect(incrValue.mock.calls[0][0]).toBe(`lto:stats:transactions:${type}:${day}`);
      });
    });

    describe('getTxStats()', () => {
      test('should increment stats for transaction type', async () => {
        const getMultipleValues = jest
          .spyOn(redisStorageService, 'getMultipleValues')
          .mockImplementation(async () => ['300', '329', '402', '293']);

        const type = 'anchor';
        expect(await storageService.getTxStats(type, 18600, 18603)).toEqual([
          { period: '2020-12-04 00:00:00', count: 300 },
          { period: '2020-12-05 00:00:00', count: 329 },
          { period: '2020-12-06 00:00:00', count: 402 },
          { period: '2020-12-07 00:00:00', count: 293 },
        ]);

        expect(getMultipleValues.mock.calls.length).toBe(1);
        expect(getMultipleValues.mock.calls[0][0]).toEqual([
          `lto:stats:transactions:${type}:18600`,
          `lto:stats:transactions:${type}:18601`,
          `lto:stats:transactions:${type}:18602`,
          `lto:stats:transactions:${type}:18603`,
        ]);
      });
    });

    describe('getProcessingHeight()', () => {
      test('should get processing height', async () => {
        const getValue = jest.spyOn(redisStorageService, 'getValue').mockImplementation(async () => '100');

        expect(await storageService.getProcessingHeight()).toBe(100);

        expect(getValue.mock.calls.length).toBe(1);
        expect(getValue.mock.calls[0][0]).toBe(`lto:processing-height`);
      });
    });

    describe('saveProcessingHeight()', () => {
      test('should save processing height', async () => {
        const height = 100;
        const setValue = jest.spyOn(redisStorageService, 'setValue').mockResolvedValue(undefined);

        await storageService.saveProcessingHeight(height);

        expect(setValue.mock.calls.length).toBe(1);
        expect(setValue.mock.calls[0][0]).toBe(`lto:processing-height`);
        expect(setValue.mock.calls[0][1]).toBe(String(height));
      });
    });

    describe('transaction fee burn', () => {
      describe('setTxFeeBurned()', () => {
        test('should set the new transcation fee burned value', async () => {
          const incrValue = jest.spyOn(redisStorageService, 'incrValue').mockResolvedValue(undefined);

          await storageService.incrTxFeeBurned(20);

          expect(incrValue.mock.calls.length).toBe(1);
          expect(incrValue.mock.calls[0][0]).toBe('lto:stats:supply:txfeeburned');
          expect(incrValue.mock.calls[0][1]).toBe(20);
        });
      });

      describe('getTxFeeBurned()', () => {
        test('should get the transaction fee burned value', async () => {
          const getValue = jest.spyOn(redisStorageService, 'getValue').mockImplementation(async () => '10');

          const result = await storageService.getTxFeeBurned();

          expect(getValue.mock.calls.length).toBe(1);
          expect(getValue.mock.calls[0][0]).toBe('lto:stats:supply:txfeeburned');

          expect(result).toBe(10);
        });

        test('should not throw if key does not exist on database (getValue throws)', async () => {
          const getValue = jest.spyOn(redisStorageService, 'getValue').mockRejectedValue('not found');

          const result = await storageService.getTxFeeBurned();

          expect(getValue.mock.calls.length).toBe(1);
          expect(getValue.mock.calls[0][0]).toBe('lto:stats:supply:txfeeburned');

          expect(result).toBe(0);
        });
      });
    });

    describe('verification methods', () => {
      const mockMethod = {
        sender: '3N9ChkxWXqgdWLLErWFrSwjqARB6NtYsvZh',
        recipient: '3NBcx7AQqDopBj3WfwCVARNYuZyt1L9xEVM',
        relationships: 0x0101,
        createdAt: 123456,
      };

      describe('getVerificationMethods()', () => {
        test('should return the verification methods from database', async () => {
          const mockVerificationMethod = new VerificationMethod(
            mockMethod.relationships,
            mockMethod.recipient,
            mockMethod.createdAt,
          );

          const getBufferSet = jest
            .spyOn(redisStorageService, 'getBufferSet')
            .mockResolvedValue([mockVerificationMethod.toBuffer()]);

          const result = await storageService.getVerificationMethods(mockMethod.sender);

          expect(getBufferSet.mock.calls.length).toBe(1);
          expect(getBufferSet.mock.calls[0][0]).toBe(`lto:did-methods:${mockMethod.sender}`);
          expect(result).toContainEqual(mockVerificationMethod);
        });
      });

      describe('saveVerificationMethod()', () => {
        test('should save a new verification method', async () => {
          const addToSet = jest.spyOn(redisStorageService, 'addToSet').mockResolvedValue(undefined);

          const mockVerificationMethod = new VerificationMethod(
            mockMethod.relationships,
            mockMethod.recipient,
            mockMethod.createdAt,
          );

          await storageService.saveVerificationMethod(mockMethod.sender, mockVerificationMethod);

          expect(addToSet.mock.calls.length).toBe(1);
          expect(addToSet.mock.calls[0][0]).toBe(`lto:did-methods:${mockMethod.sender}`);
          expect(addToSet.mock.calls[0][1]).toEqual(mockVerificationMethod.toBuffer());
        });
      });
    });

    describe('DID services', () => {
      describe('getDIDServices()', () => {
        it('should return the services from database', async () => {
          const getSet = jest.spyOn(redisStorageService, 'getSet').mockImplementation(async () => {
            return [
              JSON.stringify({ id: 'foo1', type: 'bar1', serviceEndpoint: 'baz1', timestamp: 123456 }),
              JSON.stringify({ id: 'foo2', type: 'bar2', serviceEndpoint: 'baz2', timestamp: 123456 }),
            ];
          });

          const result = await storageService.getDIDServices('mock-sender');

          expect(getSet.mock.calls.length).toBe(1);
          expect(getSet.mock.calls[0][0]).toBe(`lto:did-services:mock-sender`);

          expect(result).toEqual([
            { id: 'foo1', type: 'bar1', serviceEndpoint: 'baz1', timestamp: 123456 },
            { id: 'foo2', type: 'bar2', serviceEndpoint: 'baz2', timestamp: 123456 },
          ]);
        });
      });

      describe('saveDIDService()', () => {
        it('should return the services from database', async () => {
          const addToSet = jest.spyOn(redisStorageService, 'addToSet').mockResolvedValue(undefined);
          const mockService = { id: 'foo', type: 'bar', serviceEndpoint: 'baz', timestamp: 123456 };

          await storageService.saveDIDService('mock-sender', mockService);

          expect(addToSet.mock.calls.length).toBe(1);
          expect(addToSet.mock.calls[0][0]).toBe(`lto:did-services:mock-sender`);
          expect(addToSet.mock.calls[0][1]).toEqual(JSON.stringify(mockService));
        });
      });
    });

    describe('trust network', () => {
      describe('getRolesFor()', () => {
        test('should return the roles from database for an address', async () => {
          const expected = {
            authority: { sender: 'mock-sender', type: 100 },
          };

          const getObject = jest.spyOn(redisStorageService, 'getObject').mockImplementation(async () => {
            return expected;
          });

          const result = await storageService.getRolesFor('mock-recipient');

          expect(getObject.mock.calls.length).toBe(1);
          expect(getObject.mock.calls[0][0]).toBe('lto:roles:mock-recipient');
          expect(result).toStrictEqual(expected);
        });

        test('should not throw error if database rejects (key not found)', async () => {
          jest.spyOn(redisStorageService, 'getObject').mockResolvedValue({});

          const result = await storageService.getRolesFor('mock-recipient');
          expect(result).toStrictEqual({});
        });
      });

      describe('saveRoleAssociation()', () => {
        const mockRole = { type: 100, role: 'authority' };

        test('should save a new trust network role association', async () => {
          const setObject = jest.spyOn(redisStorageService, 'setObject').mockResolvedValue(undefined);
          const getObject = jest.spyOn(redisStorageService, 'getObject').mockResolvedValue({});

          await storageService.saveRoleAssociation('mock-recipient', 'mock-sender', mockRole);

          expect(getObject.mock.calls.length).toBe(1);
          expect(getObject.mock.calls[0][0]).toBe('lto:roles:mock-recipient');

          expect(setObject.mock.calls.length).toBe(1);
          expect(setObject.mock.calls[0][0]).toBe('lto:roles:mock-recipient');
          expect(setObject.mock.calls[0][1]).toStrictEqual({
            authority: { sender: 'mock-sender', type: mockRole.type },
          });
        });

        test('should overwrite an existing role association if it exists', async () => {
          const setObject = jest.spyOn(redisStorageService, 'setObject').mockResolvedValue(undefined);
          jest.spyOn(redisStorageService, 'getObject').mockImplementation(async () => {
            return {
              authority: { sender: 'mock-sender', type: mockRole.type },
            };
          });

          await storageService.saveRoleAssociation('mock-recipient', 'mock-sender', mockRole);

          expect(setObject.mock.calls[0][1]).toStrictEqual({
            authority: { sender: 'mock-sender', type: mockRole.type },
          });
        });
      });

      describe('removeRoleAssociation()', () => {
        const mockRole = { type: 100, role: 'authority' };

        test('should remove a trust network role association', async () => {
          const setObject = jest.spyOn(redisStorageService, 'setObject').mockResolvedValue(undefined);
          const getObject = jest.spyOn(redisStorageService, 'getObject').mockImplementation(async () => {
            return {
              authority: { sender: 'mock-sender', type: mockRole.type },
            };
          });

          await storageService.removeRoleAssociation('mock-recipient', mockRole);

          expect(getObject).toHaveBeenCalledTimes(1);
          expect(getObject).toHaveBeenNthCalledWith(1, 'lto:roles:mock-recipient');

          expect(setObject).toHaveBeenCalledTimes(1);
          expect(setObject).toHaveBeenNthCalledWith(1, 'lto:roles:mock-recipient', {});
        });
      });
    });

    describe('operation stats', () => {
      describe('incrOperationStats()', () => {
        test('should increase the value of operation stats', async () => {
          const incrValue = jest.spyOn(redisStorageService, 'incrValue').mockResolvedValue(undefined);

          await storageService.incrOperationStats(800, 5);

          expect(incrValue.mock.calls.length).toBe(1);
          expect(incrValue.mock.calls[0][0]).toBe(`lto:stats:operations:800`);
          expect(incrValue.mock.calls[0][1]).toBe(5);
        });
      });

      describe('getOperationStats()', () => {
        test('should fetch the value of operation stats', async () => {
          const getMultipleValues = jest
            .spyOn(redisStorageService, 'getMultipleValues')
            .mockImplementation(async () => ['300', '329', '402', '293']);

          expect(await storageService.getOperationStats(18600, 18603)).toEqual([
            { period: '2020-12-04 00:00:00', count: 300 },
            { period: '2020-12-05 00:00:00', count: 329 },
            { period: '2020-12-06 00:00:00', count: 402 },
            { period: '2020-12-07 00:00:00', count: 293 },
          ]);

          expect(getMultipleValues.mock.calls.length).toBe(1);
          expect(getMultipleValues.mock.calls[0][0]).toEqual([
            `lto:stats:operations:18600`,
            `lto:stats:operations:18601`,
            `lto:stats:operations:18602`,
            `lto:stats:operations:18603`,
          ]);
        });
      });
    });

    describe('associations', () => {
      describe('saveAssociation()', () => {
        test('should save associations using regular storage', async () => {
          const graphSave = jest.spyOn(redisGraphService, 'saveAssociation').mockResolvedValue(undefined);
          const redisSave = jest.spyOn(redisStorageService, 'addToSet').mockResolvedValue(undefined);

          const sender = 'some-sender';
          const recipient = 'some-recipient';

          await storageService.saveAssociation(sender, recipient);

          expect(graphSave.mock.calls.length).toBe(0);
          expect(redisSave.mock.calls.length).toBe(2);

          expect(redisSave.mock.calls[0][0]).toBe(`lto:assoc:${sender}:childs`);
          expect(redisSave.mock.calls[0][1]).toBe(recipient);
        });
      });

      describe('getAssociations()', () => {
        test('should retrieve associations using regular storage', async () => {
          const redisGet = jest.spyOn(redisStorageService, 'getSet').mockImplementation(async () => []);
          const graphGet = jest.spyOn(redisGraphService, 'getAssociations').mockImplementation(async () => {
            return { children: [], parents: [] };
          });

          const address = 'some-sender';

          const result = await storageService.getAssociations(address);

          expect(graphGet.mock.calls.length).toBe(0);
          expect(redisGet.mock.calls.length).toBe(2);

          expect(redisGet.mock.calls[0][0]).toBe(`lto:assoc:${address}:childs`);
          expect(redisGet.mock.calls[1][0]).toBe(`lto:assoc:${address}:parents`);

          expect(result).toEqual({ children: [], parents: [] });
        });
      });

      describe('removeAssociation()', () => {
        test('should remove associations using regular storage', async () => {
          jest.spyOn(redisStorageService, 'getSet').mockResolvedValue([]);
          const redisRemove = jest.spyOn(redisStorageService, 'delFromSet').mockResolvedValue(undefined);
          const graphRemove = jest.spyOn(redisGraphService, 'removeAssociation').mockResolvedValue(undefined);

          const sender = 'some-sender';
          const recipient = 'some-recipient';

          await storageService.removeAssociation(sender, recipient);

          expect(graphRemove.mock.calls.length).toBe(0);
          expect(redisRemove.mock.calls.length).toBe(2);

          expect(redisRemove.mock.calls[0]).toEqual([`lto:assoc:${sender}:childs`, recipient]);
          expect(redisRemove.mock.calls[1]).toEqual([`lto:assoc:${recipient}:parents`, sender]);
        });
      });
    });
  });

  describe('with graph enabled', () => {
    beforeEach(async () => {
      await initModule({ graphEnabled: true });
    });

    describe('associations', () => {
      describe('saveAssociation()', () => {
        test('should save associations using redis graph', async () => {
          const graphSave = jest.spyOn(redisGraphService, 'saveAssociation').mockResolvedValue(undefined);
          const redisSave = jest.spyOn(redisStorageService, 'addToSet').mockResolvedValue(undefined);

          const sender = 'some-sender';
          const recipient = 'some-recipient';

          await storageService.saveAssociation(sender, recipient);

          expect(graphSave.mock.calls.length).toBe(1);
          expect(redisSave.mock.calls.length).toBe(0);

          expect(graphSave.mock.calls[0][0]).toBe(sender);
          expect(graphSave.mock.calls[0][1]).toBe(recipient);
        });
      });

      describe('getAssociations()', () => {
        test('should retrieve associations using redis graph', async () => {
          const redisGet = jest.spyOn(redisStorageService, 'getSet').mockImplementation(async () => []);
          const graphGet = jest.spyOn(redisGraphService, 'getAssociations').mockImplementation(async () => {
            return { children: [], parents: [] };
          });

          const address = 'some-sender';

          const result = await storageService.getAssociations(address);

          expect(graphGet.mock.calls.length).toBe(1);
          expect(redisGet.mock.calls.length).toBe(0);

          expect(graphGet.mock.calls[0][0]).toBe(address);

          expect(result).toEqual({ children: [], parents: [] });
        });
      });

      describe('removeAssociation()', () => {
        test('should remove associations using redis graph', async () => {
          const redisRemove = jest.spyOn(redisStorageService, 'delFromSet').mockResolvedValue(undefined);
          const graphRemove = jest.spyOn(redisGraphService, 'removeAssociation').mockResolvedValue(undefined);

          const sender = 'some-sender';
          const recipient = 'some-recipient';

          await storageService.removeAssociation(sender, recipient);

          expect(redisRemove.mock.calls.length).toBe(0);
          expect(graphRemove.mock.calls.length).toBe(1);

          expect(graphRemove.mock.calls[0]).toEqual([sender, recipient]);
        });
      });
    });
  });
});
