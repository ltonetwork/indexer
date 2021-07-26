import { Test, TestingModule } from '@nestjs/testing';
import { AnchorModuleConfig } from './anchor.module';
import { AnchorService } from './anchor.service';
import { StorageService } from '../storage/storage.service';

describe('AnchorService', () => {
  let module: TestingModule;
  let anchorService: AnchorService;
  let storageService: StorageService;

  function spy() {
    const storage = {
      saveAnchor: jest.spyOn(storageService, 'saveAnchor').mockImplementation(async () => { }),
    };

    return { storage };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(AnchorModuleConfig).compile();
    await module.init();

    anchorService = module.get<AnchorService>(AnchorService);
    storageService = module.get<StorageService>(StorageService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('index', () => {

    describe('data transaction (old)', () => {
      test('should process the data transaction', async () => {
        const spies = spy();
  
        const transaction = {
          id: 'fake_transaction',
          type: 12,
          data: [
            {
              key: anchorService.anchorToken,
              value: 'base64:LGeJmzGkBiCwdgA1cgqcq9f0FMbaPbVhRhseSP4mywg',
            },
            {
              key: 'invalid key',
              value: 'base64:LGeJmzGkBiCwdgA1cgqcq9f0FMbaPbVhRhseSP4mywga',
            },
          ],
        };
        await anchorService.index({transaction: transaction as any, blockHeight: 1, position: 0});
  
        expect(spies.storage.saveAnchor.mock.calls.length).toBe(1);
        expect(spies.storage.saveAnchor.mock.calls[0][0])
          .toBe('2c67899b31a40620b0760035720a9cabd7f414c6da3db561461b1e48fe26cb08');
        expect(spies.storage.saveAnchor.mock.calls[0][1])
          .toMatchObject({ id: 'fake_transaction', blockHeight: 1, position: 0 });
      });
    });

    describe('anchor transaction (new)', () => {
      test('should process the anchor transaction', async () => {
        const spies = spy();
  
        const transaction = {
          id: 'fake_transaction',
          type: 15,
          anchors: [
            '3zLWTHPNkmDsCRi2kZqFXFSBnTYykz13gHLezU4p6zmu',
          ],
        };
        await anchorService.index({transaction: transaction as any, blockHeight: 1, position: 0});
  
        expect(spies.storage.saveAnchor.mock.calls.length).toBe(1);
        expect(spies.storage.saveAnchor.mock.calls[0][0])
          .toBe('2c67899b31a40620b0760035720a9cabd7f414c6da3db561461b1e48fe26cb08');
        expect(spies.storage.saveAnchor.mock.calls[0][1])
          .toMatchObject({ id: 'fake_transaction', blockHeight: 1, position: 0 });
      });
    });
  });
});
