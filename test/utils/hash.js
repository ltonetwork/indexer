const Hash = require('../../src/utils/hash');
const { expect } = require('chai');

describe('Hash', () => {

  describe('hexDecode', () => {
    it('should transform hex data into uint8array', () => {
      const hash = '2c67899b31a40620b0760035720a9cabd7f414c6da3db561461b1e48fe26cb08';
      const bytes = Hash.decode(hash, 'hex');

      const base64 = Hash.base64Encode(bytes);
      const expected = 'LGeJmzGkBiCwdgA1cgqcq9f0FMbaPbVhRhseSP4mywg=';
      expect(base64).to.eq(expected);
    });
  });

  describe('base58Decode', () => {
    it('should transform base58 data into uint8array', () => {
      const hash = '3zLWTHPNkmDsCRi2kZqFXFSBnTYykz13gHLezU4p6zmu';
      const bytes = Hash.decode(hash, 'base58');

      const base64 = Hash.base64Encode(bytes);
      const expected = 'LGeJmzGkBiCwdgA1cgqcq9f0FMbaPbVhRhseSP4mywg=';
      expect(base64).to.eq(expected);
    });
  });

  describe('base64Decode', () => {
    it('should transform base64 data into uint8array', () => {
      const hash = 'LGeJmzGkBiCwdgA1cgqcq9f0FMbaPbVhRhseSP4mywg=';
      const bytes = Hash.decode(hash, 'base64');

      const hex = Hash.hexEncode(bytes);
      const expected = '2c67899b31a40620b0760035720a9cabd7f414c6da3db561461b1e48fe26cb08';
      expect(hex).to.eq(expected);
    });
  });

  describe('validateSHA256', () => {

    it('should correctly validateSHA256 hex sha256', () => {
      const hash = '2c67899b31a40620b0760035720a9cabd7f414c6da3db561461b1e48fe26cb08';
      expect(Hash.validateSHA256(hash, 'hex')).to.be.true;
    });

    it('should correctly validateSHA256 base58 sha256', () => {
      const hash = '3zLWTHPNkmDsCRi2kZqFXFSBnTYykz13gHLezU4p6zmu';
      expect(Hash.validateSHA256(hash, 'base58')).to.be.true;
    });

    it('should correctly validateSHA256 base64 sha256', () => {
      const hash = 'LGeJmzGkBiCwdgA1cgqcq9f0FMbaPbVhRhseSP4mywg=';
      expect(Hash.validateSHA256(hash, 'base64')).to.be.true;
    });
  })
});