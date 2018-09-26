import { Test, TestingModule } from '@nestjs/testing';
import { HashModuleConfig } from './hash.module';
import { HashService } from './hash.service';
import { NodeService } from '../node/node.service';
import { RedisService } from '../redis/redis.service';

describe('HashService', () => {
  let module: TestingModule;
  let hashService: HashService;
  let nodeService: NodeService;
  let redisService: RedisService;

  function spy() {
    const node = {
      getNodeWallet: jest.spyOn(nodeService, 'getNodeWallet')
        .mockImplementation(() => 'fake_wallet'),
      createAnchorTransaction: jest.spyOn(nodeService, 'createAnchorTransaction')
        .mockImplementation(() => 'fake_transaction'),
      getUnconfirmedAnchor: jest.spyOn(nodeService, 'getUnconfirmedAnchor')
        .mockImplementation(() => 'fake_transaction'),
    };
    const redisConnection = {
      get: jest.fn(() => 'fake_transaction'),
    };
    const redis = {
      connect: jest.spyOn(redisService, 'connect')
        .mockImplementation(() => redisConnection),
    };

    return { node, redis, redisConnection };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(HashModuleConfig).compile();
    await module.init();

    hashService = module.get<HashService>(HashService);
    nodeService = module.get<NodeService>(NodeService);
    redisService = module.get<RedisService>(RedisService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('anchor()', () => {
    test('should anchor hash with given encoding', async () => {
      const spies = spy();

      const hash = '2C26B46B68FFC68FF99B453C1D30413413422D706483BFA0F98A5E886266E7AE';
      const encoding = 'hex';
      const chainpoint = {
        '@context': 'https://w3id.org/chainpoint/v2',
        'anchors': [
          {
            sourceId: 'fake_transaction',
            type: 'LTODataTransaction',
          },
        ],
        'targetHash': hash,
        'type': 'ChainpointSHA256v2',
      };

      expect(await hashService.anchor(hash, encoding)).toEqual(chainpoint);

      expect(spies.redis.connect.mock.calls.length).toBe(1);
      expect(spies.redis.connect.mock.calls[0][0]).toBe('redis://localhost');

      expect(spies.node.getNodeWallet.mock.calls.length).toBe(1);
      expect(spies.node.createAnchorTransaction.mock.calls.length).toBe(1);
      expect(spies.node.createAnchorTransaction.mock.calls[0][0]).toBe('fake_wallet');
      expect(spies.node.createAnchorTransaction.mock.calls[0][1]).toBe('LCa0a2j/xo/5m0U8HTBBNBNCLXBkg7+g+YpeiGJm564=');
    });
  });

  describe('getTransactionByHash()', () => {
    test('should get transaction by hash', async () => {
      const spies = spy();

      const hash = '2C26B46B68FFC68FF99B453C1D30413413422D706483BFA0F98A5E886266E7AE';
      const chainpoint = {
        '@context': 'https://w3id.org/chainpoint/v2',
        'anchors': [
          {
            sourceId: 'fake_transaction',
            type: 'LTODataTransaction',
          },
        ],
        'targetHash': hash,
        'type': 'ChainpointSHA256v2',
      };

      expect(await hashService.getTransactionByHash(hash)).toEqual(chainpoint);

      expect(spies.redis.connect.mock.calls.length).toBe(1);
      expect(spies.redis.connect.mock.calls[0][0]).toBe('redis://localhost');

      expect(spies.redisConnection.get.mock.calls.length).toBe(1);
      expect(spies.redisConnection.get.mock.calls[0][0])
        .toBe('lto-anchor:anchor:2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae');

      expect(spies.node.getUnconfirmedAnchor.mock.calls.length).toBe(0);
    });

    test('should get transaction by hash by looking in unconfirmed transactions', async () => {
      const spies = spy();

      spies.redisConnection.get.mockImplementation(() => undefined);

      const hash = '2C26B46B68FFC68FF99B453C1D30413413422D706483BFA0F98A5E886266E7AE';
      const chainpoint = {
        '@context': 'https://w3id.org/chainpoint/v2',
        'anchors': [
          {
            sourceId: 'fake_transaction',
            type: 'LTODataTransaction',
          },
        ],
        'targetHash': hash,
        'type': 'ChainpointSHA256v2',
      };

      expect(await hashService.getTransactionByHash(hash)).toEqual(chainpoint);

      expect(spies.redis.connect.mock.calls.length).toBe(1);
      expect(spies.redis.connect.mock.calls[0][0]).toBe('redis://localhost');

      expect(spies.redisConnection.get.mock.calls.length).toBe(1);
      expect(spies.redisConnection.get.mock.calls[0][0])
        .toBe('lto-anchor:anchor:2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae');

      expect(spies.node.getUnconfirmedAnchor.mock.calls.length).toBe(1);
      expect(spies.node.getUnconfirmedAnchor.mock.calls[0][0]).toBe('LCa0a2j/xo/5m0U8HTBBNBNCLXBkg7+g+YpeiGJm564=');
    });
  });
});
