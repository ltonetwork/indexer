import { Graph, ResultSet } from 'redisgraph.js';
import { mocked } from 'ts-jest/utils';
import { Test, TestingModule } from '@nestjs/testing';

import { RedisGraphService } from './redis-graph.service';
import { StorageModuleConfig } from '../storage.module';
import { ConfigService } from '../../config/config.service';

jest.mock('redisgraph.js');

describe('RedisGraphService', () => {
  let module: TestingModule;
  let configService: ConfigService;
  let redisGraphService: RedisGraphService;

  const graphMock = mocked(Graph, true);

  function spy() {
    const config = {
      getRedisGraph: jest.spyOn(configService, 'getRedisGraph').mockImplementation(() => { return { host: 'host', port: '123' } }),
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

      expect(spies.config.getRedisGraph).toBeCalledTimes(1);
      expect(graphMock).toBeCalledTimes(1);
      expect(graphMock.mock.calls[0]).toEqual(['indexer', 'host', '123']);
    });
  });

  describe('saveAssociation()', () => {
    test('should save an association', async () => {
      const spies = spy();

      await redisGraphService.saveAssociation('sender', 'party');

      const query = mocked(graphMock.mock.instances[0].query).mockImplementation(async () => { return {} as ResultSet });

      expect(graphMock).toBeCalledTimes(1);
      expect(query).toBeCalledTimes(1);
      expect(query).toHaveBeenNthCalledWith(1, `MERGE (s:sender {address:'sender'} )-[:ASSOCIATION]->(p:party {address:'party'} )`);
    });
  });

  describe('getAssociations()', () => {
    test('should return the associations from an address', async () => {
      const spies = spy();

      await redisGraphService.getAssociations('address');
      
      const query = mocked(graphMock.mock.instances[0].query).mockImplementation(async () => { return {} as ResultSet });

      expect(graphMock).toBeCalledTimes(1);
      expect(query).toBeCalledTimes(2);
      expect(query).toHaveBeenNthCalledWith(1, `MATCH (s:sender { address: 'address' })-[:ASSOCIATION]->(p:party) RETURN p.address as address`);
      expect(query).toHaveBeenNthCalledWith(2, `MATCH (s:sender)-[:ASSOCIATION]->(p:party { address: 'address' }) RETURN s.address as address`);
    });
  });

  describe('removeAssociation()', () => {
    test('should remove the associations from an address and the child', async () => {
      const spies = spy();

      await redisGraphService.removeAssociation('sender', 'party');

      const query = mocked(graphMock.mock.instances[0].query).mockImplementation(async () => { return {} as ResultSet });

      expect(graphMock).toBeCalledTimes(1);
      expect(query).toBeCalledTimes(2);
      expect(query).toHaveBeenNthCalledWith(1, `MATCH (s:sender { address: 'sender'} )-[a:ASSOCIATION]->(p:party { address: 'party' }) DELETE a`);
      expect(query).toHaveBeenNthCalledWith(2, `MATCH (s:sender { address: 'party'} )-[a:ASSOCIATION]->() DELETE a`);
    });
  });
});