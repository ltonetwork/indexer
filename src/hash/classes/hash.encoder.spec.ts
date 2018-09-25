import { HashEncoder } from './hash.encoder';

describe('HashEncoder', () => {
  let hashEncoder;

  beforeEach(async () => {
    hashEncoder = new HashEncoder();
  });

  describe('hexDecode', () => {
    it('should transform hex data into uint8array', async () => {
      const hash = '2c67899b31a40620b0760035720a9cabd7f414c6da3db561461b1e48fe26cb08';
      const bytes = hashEncoder.decode(hash, 'hex');

      const base64 = hashEncoder.base64Encode(bytes);
      const expected = 'LGeJmzGkBiCwdgA1cgqcq9f0FMbaPbVhRhseSP4mywg=';
      expect(base64).toEqual(expected);
    });
  });

  describe('base58Decode', () => {
    it('should transform base58 data into uint8array', async () => {
      const hash = '3zLWTHPNkmDsCRi2kZqFXFSBnTYykz13gHLezU4p6zmu';
      const bytes = hashEncoder.decode(hash, 'base58');

      const base64 = hashEncoder.base64Encode(bytes);
      const expected = 'LGeJmzGkBiCwdgA1cgqcq9f0FMbaPbVhRhseSP4mywg=';
      expect(base64).toEqual(expected);
    });
  });

  describe('base64Decode', () => {
    it('should transform base64 data into uint8array', async () => {
      const hash = 'LGeJmzGkBiCwdgA1cgqcq9f0FMbaPbVhRhseSP4mywg=';
      const bytes = hashEncoder.decode(hash, 'base64');

      const hex = hashEncoder.hexEncode(bytes);
      const expected = '2c67899b31a40620b0760035720a9cabd7f414c6da3db561461b1e48fe26cb08';
      expect(hex).toEqual(expected);
    });
  });

  describe('validateSHA256', () => {
    it('should correctly validateSHA256 hex sha256', async () => {
      const hash = '2c67899b31a40620b0760035720a9cabd7f414c6da3db561461b1e48fe26cb08';
      expect(hashEncoder.validateSHA256(hash, 'hex')).toBe(true);
    });

    it('should correctly validateSHA256 base58 sha256', async () => {
      const hash = '3zLWTHPNkmDsCRi2kZqFXFSBnTYykz13gHLezU4p6zmu';
      expect(hashEncoder.validateSHA256(hash, 'base58')).toBe(true);
    });

    it('should correctly validateSHA256 base64 sha256', async () => {
      const hash = 'LGeJmzGkBiCwdgA1cgqcq9f0FMbaPbVhRhseSP4mywg=';
      expect(hashEncoder.validateSHA256(hash, 'base64')).toBe(true);
    });
  });
});
