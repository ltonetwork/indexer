import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HashModuleConfig } from './hash.module';
import { ConfigService } from '../config/config.service';
import { HashService } from './hash.service';
import { StorageService } from '../storage/storage.service';

describe('HashService', () => {
  let module: TestingModule;
  let hashService: HashService;
  let storageService: StorageService;
  let configService: ConfigService;
  let app: INestApplication;

  beforeEach(async () => {
    module = await Test.createTestingModule(HashModuleConfig).compile();
    app = module.createNestApplication();
    await app.init();

    hashService = module.get<HashService>(HashService);
    storageService = module.get<StorageService>(StorageService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('verifyAnchors()', () => {
    test('return verified is true if all anchors are found', async () => {
      const hashes = [
        '8EjkXVSTxMFjCvNNsTo8RBMDEVQmk7gYkW4SCDuvdsBG',
        'FJKTv1un7qsnyKdwKez7B67JJp3oCU5ntCVXcRsWEjtg',
        '6FbDRScGruVdATaNWzD51xJkTfYCVwxSZDb7gzqCLzwf',
      ];

      const stored = {
        '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b': { id: 1 },
        'd4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35': { id: 2 },
        '4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce': { id: 3 },
      };

      const getAnchor = jest.spyOn(storageService, 'getAnchor')
          .mockImplementation(async hash => stored[hash] || {});

      const result = await hashService.verifyAnchors(hashes, 'base58');

      expect(getAnchor.mock.calls.length).toBe(3);
      expect(getAnchor.mock.calls[0][0]).toBe('6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b');
      expect(getAnchor.mock.calls[1][0]).toBe('d4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35');
      expect(getAnchor.mock.calls[2][0]).toBe('4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce');

      expect(result.anchors).toEqual({
        '8EjkXVSTxMFjCvNNsTo8RBMDEVQmk7gYkW4SCDuvdsBG': true,
        'FJKTv1un7qsnyKdwKez7B67JJp3oCU5ntCVXcRsWEjtg': true,
        '6FbDRScGruVdATaNWzD51xJkTfYCVwxSZDb7gzqCLzwf': true,
      });
      expect(result.verified).toBe(true);
    });

    test('return verified is false if one anchors is not found', async () => {
      const hashes = [
        '8EjkXVSTxMFjCvNNsTo8RBMDEVQmk7gYkW4SCDuvdsBG',
        'FJKTv1un7qsnyKdwKez7B67JJp3oCU5ntCVXcRsWEjtg',
        '6FbDRScGruVdATaNWzD51xJkTfYCVwxSZDb7gzqCLzwf',
      ];

      const stored = {
        '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b': { id: 1 },
        'd4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35': { },
        '4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce': { id: 3 },
      };

      const getAnchor = jest.spyOn(storageService, 'getAnchor')
          .mockImplementation(async hash => stored[hash] || {});

      const result = await hashService.verifyAnchors(hashes, 'base58');

      expect(getAnchor.mock.calls.length).toBe(3);
      expect(getAnchor.mock.calls[0][0]).toBe('6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b');
      expect(getAnchor.mock.calls[1][0]).toBe('d4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35');
      expect(getAnchor.mock.calls[2][0]).toBe('4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce');

      expect(result.anchors).toEqual({
        '8EjkXVSTxMFjCvNNsTo8RBMDEVQmk7gYkW4SCDuvdsBG': true,
        'FJKTv1un7qsnyKdwKez7B67JJp3oCU5ntCVXcRsWEjtg': false,
        '6FbDRScGruVdATaNWzD51xJkTfYCVwxSZDb7gzqCLzwf': true,
      });
      expect(result.verified).toBe(false);
    });
  });

  describe('verifyMappedAnchors()', () => {
    test('return verified is true if all anchors match', async () => {
      const pairs = {
        '2Nk8JfzQ47wX7XEdkemRJbNTLxC529YwJ92U9g6FyeAc': '8EjkXVSTxMFjCvNNsTo8RBMDEVQmk7gYkW4SCDuvdsBG',
        '4WjkssnwoTRrTo4xKX8rac1b3zwrGvpy4kgRCsHJ49yc': 'FJKTv1un7qsnyKdwKez7B67JJp3oCU5ntCVXcRsWEjtg',
        '28gJaguAnsUEUMcfzXU6tpCLjhTH2xfg2G3NEHzetmUd': '6FbDRScGruVdATaNWzD51xJkTfYCVwxSZDb7gzqCLzwf',
      };

      const stored = {
        '146da586036684deee1acba1ae0520a79e7502da8b302dc4b683bd4f88f7c8e1': { anchor: '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b' },
        '34313fc9e1050a02c7d4931f8312cca75b9f4edef653b34794606526b9ec5a7b': { anchor: 'd4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35' },
        '10d331592917e8ee791c5a01f2cf4bd54de81bf648fd7fd1340aa55b73ce7bda': { anchor: '4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce' },
      };

      const getMappedAnchor = jest.spyOn(storageService, 'getMappedAnchor')
          .mockImplementation(async hash => stored[hash] || {});

      const result = await hashService.verifyMappedAnchors(pairs, 'base58');

      expect(getMappedAnchor.mock.calls.length).toBe(3);
      expect(getMappedAnchor.mock.calls[0][0]).toBe('146da586036684deee1acba1ae0520a79e7502da8b302dc4b683bd4f88f7c8e1');
      expect(getMappedAnchor.mock.calls[1][0]).toBe('34313fc9e1050a02c7d4931f8312cca75b9f4edef653b34794606526b9ec5a7b');
      expect(getMappedAnchor.mock.calls[2][0]).toBe('10d331592917e8ee791c5a01f2cf4bd54de81bf648fd7fd1340aa55b73ce7bda');

      expect(result.anchors).toEqual(pairs);
      expect(result.verified).toBe(true);
    });

    test('return verified is false if one anchors is not found', async () => {
      const pairs = {
        '2Nk8JfzQ47wX7XEdkemRJbNTLxC529YwJ92U9g6FyeAc': '8EjkXVSTxMFjCvNNsTo8RBMDEVQmk7gYkW4SCDuvdsBG',
        '4WjkssnwoTRrTo4xKX8rac1b3zwrGvpy4kgRCsHJ49yc': 'FJKTv1un7qsnyKdwKez7B67JJp3oCU5ntCVXcRsWEjtg',
        '28gJaguAnsUEUMcfzXU6tpCLjhTH2xfg2G3NEHzetmUd': '6FbDRScGruVdATaNWzD51xJkTfYCVwxSZDb7gzqCLzwf',
      };

      const stored = {
        '146da586036684deee1acba1ae0520a79e7502da8b302dc4b683bd4f88f7c8e1': { anchor: '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b' },
        '34313fc9e1050a02c7d4931f8312cca75b9f4edef653b34794606526b9ec5a7b': { },
        '10d331592917e8ee791c5a01f2cf4bd54de81bf648fd7fd1340aa55b73ce7bda': { anchor: '4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce' },
      };

      const getMappedAnchor = jest.spyOn(storageService, 'getMappedAnchor')
          .mockImplementation(async hash => stored[hash] || {});

      const result = await hashService.verifyMappedAnchors(pairs, 'base58');

      expect(getMappedAnchor.mock.calls.length).toBe(3);
      expect(getMappedAnchor.mock.calls[0][0]).toBe('146da586036684deee1acba1ae0520a79e7502da8b302dc4b683bd4f88f7c8e1');
      expect(getMappedAnchor.mock.calls[1][0]).toBe('34313fc9e1050a02c7d4931f8312cca75b9f4edef653b34794606526b9ec5a7b');
      expect(getMappedAnchor.mock.calls[2][0]).toBe('10d331592917e8ee791c5a01f2cf4bd54de81bf648fd7fd1340aa55b73ce7bda');

      expect(result.anchors).toEqual({
        '2Nk8JfzQ47wX7XEdkemRJbNTLxC529YwJ92U9g6FyeAc': '8EjkXVSTxMFjCvNNsTo8RBMDEVQmk7gYkW4SCDuvdsBG',
        '4WjkssnwoTRrTo4xKX8rac1b3zwrGvpy4kgRCsHJ49yc': null,
        '28gJaguAnsUEUMcfzXU6tpCLjhTH2xfg2G3NEHzetmUd': '6FbDRScGruVdATaNWzD51xJkTfYCVwxSZDb7gzqCLzwf',
      });
      expect(result.verified).toBe(false);
    });

    test('return verified is false if one anchors does not match', async () => {
      const pairs = {
        '2Nk8JfzQ47wX7XEdkemRJbNTLxC529YwJ92U9g6FyeAc': '8EjkXVSTxMFjCvNNsTo8RBMDEVQmk7gYkW4SCDuvdsBG',
        '4WjkssnwoTRrTo4xKX8rac1b3zwrGvpy4kgRCsHJ49yc': 'FJKTv1un7qsnyKdwKez7B67JJp3oCU5ntCVXcRsWEjtg',
        '28gJaguAnsUEUMcfzXU6tpCLjhTH2xfg2G3NEHzetmUd': '6FbDRScGruVdATaNWzD51xJkTfYCVwxSZDb7gzqCLzwf',
      };

      const stored = {
        '146da586036684deee1acba1ae0520a79e7502da8b302dc4b683bd4f88f7c8e1': { anchor: '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b' },
        '34313fc9e1050a02c7d4931f8312cca75b9f4edef653b34794606526b9ec5a7b': { anchor: 'd4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35' },
        '10d331592917e8ee791c5a01f2cf4bd54de81bf648fd7fd1340aa55b73ce7bda': { anchor: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
      };

      const getMappedAnchor = jest.spyOn(storageService, 'getMappedAnchor')
          .mockImplementation(async hash => stored[hash] || {});

      const result = await hashService.verifyMappedAnchors(pairs, 'base58');

      expect(getMappedAnchor.mock.calls.length).toBe(3);
      expect(getMappedAnchor.mock.calls[0][0]).toBe('146da586036684deee1acba1ae0520a79e7502da8b302dc4b683bd4f88f7c8e1');
      expect(getMappedAnchor.mock.calls[1][0]).toBe('34313fc9e1050a02c7d4931f8312cca75b9f4edef653b34794606526b9ec5a7b');
      expect(getMappedAnchor.mock.calls[2][0]).toBe('10d331592917e8ee791c5a01f2cf4bd54de81bf648fd7fd1340aa55b73ce7bda');

      expect(result.anchors).toEqual({
        '2Nk8JfzQ47wX7XEdkemRJbNTLxC529YwJ92U9g6FyeAc': '8EjkXVSTxMFjCvNNsTo8RBMDEVQmk7gYkW4SCDuvdsBG',
        '4WjkssnwoTRrTo4xKX8rac1b3zwrGvpy4kgRCsHJ49yc': 'FJKTv1un7qsnyKdwKez7B67JJp3oCU5ntCVXcRsWEjtg',
        '28gJaguAnsUEUMcfzXU6tpCLjhTH2xfg2G3NEHzetmUd': 'GKot5hBsd81kMupNCXHaqbhv3huEbxAFMLnpcX2hniwn',
      });
      expect(result.verified).toBe(false);
    });
  });
});