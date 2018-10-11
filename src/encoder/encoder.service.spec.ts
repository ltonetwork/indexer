import { Test, TestingModule } from '@nestjs/testing';
import { EncoderModuleConfig } from './encoder.module';
import { EncoderService } from './encoder.service';

describe('EncoderService', () => {
  let module: TestingModule;
  let encoderService: EncoderService;

  beforeEach(async () => {
    module = await Test.createTestingModule(EncoderModuleConfig).compile();
    await module.init();

    encoderService = module.get<EncoderService>(EncoderService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('hexDecode', () => {
    it('should transform hex data into uint8array', async () => {
      const hash = '2c67899b31a40620b0760035720a9cabd7f414c6da3db561461b1e48fe26cb08';
      const bytes = encoderService.decode(hash, 'hex');

      const base64 = encoderService.base64Encode(bytes);
      const expected = 'LGeJmzGkBiCwdgA1cgqcq9f0FMbaPbVhRhseSP4mywg=';
      expect(base64).toEqual(expected);
    });
  });

  describe('base58Decode', () => {
    it('should transform base58 data into uint8array', async () => {
      const hash = '3zLWTHPNkmDsCRi2kZqFXFSBnTYykz13gHLezU4p6zmu';
      const bytes = encoderService.decode(hash, 'base58');

      const base64 = encoderService.base64Encode(bytes);
      const expected = 'LGeJmzGkBiCwdgA1cgqcq9f0FMbaPbVhRhseSP4mywg=';
      expect(base64).toEqual(expected);
    });
  });

  describe('base64Decode', () => {
    it('should transform base64 data into uint8array', async () => {
      const hash = 'LGeJmzGkBiCwdgA1cgqcq9f0FMbaPbVhRhseSP4mywg=';
      const bytes = encoderService.decode(hash, 'base64');

      const hex = encoderService.hexEncode(bytes);
      const expected = '2c67899b31a40620b0760035720a9cabd7f414c6da3db561461b1e48fe26cb08';
      expect(hex).toEqual(expected);
    });
  });

  describe('validateHash', () => {
    it('should correctly validateHash hex sha256', async () => {
      const hash = '2c67899b31a40620b0760035720a9cabd7f414c6da3db561461b1e48fe26cb08';
      expect(encoderService.validateHash(hash, 'hex')).toBe(true);
    });

    it('should correctly validateHash base58 sha256', async () => {
      const hash = '3zLWTHPNkmDsCRi2kZqFXFSBnTYykz13gHLezU4p6zmu';
      expect(encoderService.validateHash(hash, 'base58')).toBe(true);
    });

    it('should correctly validateHash base64 sha256', async () => {
      const hash = 'LGeJmzGkBiCwdgA1cgqcq9f0FMbaPbVhRhseSP4mywg=';
      expect(encoderService.validateHash(hash, 'base64')).toBe(true);
    });
  });
});
