
const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const ALPHABET_MAP = ALPHABET.split('').reduce((map, c, i) => {
  map[c] = i;
  return map;
}, {});

class Hash {

  static base64Encode(buffer) {
    return Buffer.from(String.fromCharCode.apply(null, buffer), 'binary').toString('base64');
  }

  static hexEncode(buffer) {
    return Buffer.from(String.fromCharCode.apply(null, buffer), 'binary').toString('hex');
  }

  static decode(hash, encoding) {
    let hashBytes;
    switch(encoding) {
      case 'base64':
        hashBytes = this.base64Decode(hash);
        break;

      case 'base58':
        hashBytes = this.base58Decode(hash);
        break;

      case 'hex':
        hashBytes = this.hexDecode(hash);
        break;
    }

    return hashBytes;
  }

  static validateSHA256(hash, encoding) {
    const hashBytes = this.decode(hash, encoding);
    return (hashBytes.length == 32);
  }

  static base64Decode(hash) {
    const bytes = Buffer.from(hash, 'base64').toString('binary');
    return new Uint8Array(bytes.split('').map(charCodeAt));

    function charCodeAt (c) {
      return c.charCodeAt(0)
    }
  }

  static base58Decode(hash) {
    if (!hash.length) return new Uint8Array(0);

    const bytes = [0];

    for (let i = 0; i < hash.length; i++) {

      const c = hash[i];
      if (!(c in ALPHABET_MAP)) {
        throw `There is no character "${c}" in the Base58 sequence!`;
      }

      for (let j = 0; j < bytes.length; j++) {
        bytes[j] *= 58;
      }

      bytes[0] += ALPHABET_MAP[c];
      let carry = 0;

      for (let j = 0; j < bytes.length; j++) {
        bytes[j] += carry;
        carry = bytes[j] >> 8;
        bytes[j] &= 0xff;
      }

      while (carry) {
        bytes.push(carry & 0xff);
        carry >>= 8;
      }

    }

    for (let i = 0; hash[i] === '1' && i < hash.length - 1; i++) {
      bytes.push(0);
    }

    return new Uint8Array(bytes.reverse());
  }

  static hexDecode(hash) {
    const bytes = Buffer.from(hash, 'hex').toString('binary');
    return new Uint8Array(bytes.split('').map(charCodeAt));

    function charCodeAt (c) {
      return c.charCodeAt(0)
    }
  }
}

module.exports = Hash;