import { Graph, ResultSet } from 'redisgraph.js';
import { Test, TestingModule } from '@nestjs/testing';

import { RedisGraphService } from './redis-graph.service';
import { StorageModuleConfig } from '../storage.module';
import { ConfigService } from '../../common/config/config.service';

jest.mock('redisgraph.js');

describe('RedisGraphService', () => {
  let module: TestingModule;
  let configService: ConfigService;
  let redisGraphService: RedisGraphService;

  const graphMock = jest.mocked(Graph);

  function spy() {
    const config = {
      getRedisUrl: jest.spyOn(configService, 'getRedisUrl').mockImplementation(() => ('https://host:123')),
    };

    return { config };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(StorageModuleConfig).compile();

    graphMock.mockClear();
    configService = module.get<ConfigService>(ConfigService);
    redisGraphService = module.get<RedisGraphService>(RedisGraphService);

    await module.init();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('init()', () => {
    test('should connect to redis-graph', async () => {
      const spies = spy();

      await redisGraphService.init();

      expect(spies.config.getRedisUrl).toBeCalledTimes(1);
      expect(graphMock).toBeCalledTimes(1);
      expect(graphMock.mock.calls[0]).toEqual(['indexer', 'host', '123']);
    });
  });

  describe('saveAssociation()', () => {
    test('should save an association', async () => {
      await redisGraphService.saveAssociation('sender', 'recipient');

      const query = jest.mocked(graphMock.mock.instances[0].query).mockImplementation(async () => ({} as ResultSet));

      expect(graphMock).toBeCalledTimes(1);
      expect(query).toBeCalledTimes(1);
      expect(query).toHaveBeenNthCalledWith(1, `MERGE (s:sender {address:'sender'} )-[:ASSOCIATION]->(p:recipient {address:'recipient'} )`);
    });
  });

  describe('getAssociations()', () => {
    test('should return the associations from an address', async () => {
      await redisGraphService.getAssociations('address');

      const query = jest.mocked(graphMock.mock.instances[0].query).mockImplementation(async () => ({} as ResultSet));

      expect(graphMock).toBeCalledTimes(1);
      expect(query).toBeCalledTimes(2);
      expect(query).toHaveBeenNthCalledWith(1, `MATCH (s:sender { address: 'address' })-[:ASSOCIATION]->(p:recipient) RETURN p.address as address`);
      expect(query).toHaveBeenNthCalledWith(2, `MATCH (s:sender)-[:ASSOCIATION]->(p:recipient { address: 'address' }) RETURN s.address as address`);
    });
  });

  describe('removeAssociation()', () => {
    test('should remove the associations from an address and the child', async () => {
      await redisGraphService.removeAssociation('sender', 'recipient');

      const query = jest.mocked(graphMock.mock.instances[0].query).mockImplementation(async () => ({} as ResultSet));

      expect(graphMock).toBeCalledTimes(1);
      expect(query).toBeCalledTimes(2);
      expect(query).toHaveBeenNthCalledWith(1, `MATCH (s:sender { address: 'sender'} )-[a:ASSOCIATION]->(p:recipient { address: 'recipient' }) DELETE a`);
      expect(query).toHaveBeenNthCalledWith(2, `MATCH (s:sender { address: 'recipient'} )-[a:ASSOCIATION]->() DELETE a`);
    });
  });
});
