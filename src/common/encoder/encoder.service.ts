import { Injectable } from '@nestjs/common';

// TODO: Remove this service, just use the @scure/base package

@Injectable()
export class EncoderService {
  private alphabet: string;
  private alphabetMap: object;
  private allowsHashLengths: Array<number>;

  constructor() {
    this.alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    this.alphabetMap = this.alphabet.split('').reduce((map, c, i) => {
      map[c] = i;
      return map;
    }, {});
    this.allowsHashLengths = [16, 20, 32, 48, 64];
  }

  encode(hashBytes: Uint8Array, encoding: string): string {
    switch (encoding) {
      case 'base64':
        return this.base64Encode(hashBytes);
      case 'base58':
        return this.base58Encode(hashBytes);
      case 'hex':
        return this.hexEncode(hashBytes);
      default:
        throw new Error(`Unsupported encoding ${encoding}`);
    }
  }

  base64Encode(buffer) {
    return Buffer.from(String.fromCharCode.apply(null, buffer), 'binary').toString('base64');
  }

  hexEncode(buffer) {
    return Buffer.from(String.fromCharCode.apply(null, buffer), 'binary').toString('hex');
  }

  /* @todo Use LTO crypt library for base58 */
  base58Encode(buffer) {
    if (!buffer.length) return '';

    const digits = [0];
    for (let i = 0; i < buffer.length; i++) {
      for (let j = 0; j < digits.length; j++) {
        digits[j] <<= 8;
      }

      digits[0] += buffer[i];
      let carry = 0;

      for (let k = 0; k < digits.length; k++) {
        digits[k] += carry;
        carry = (digits[k] / 58) | 0;
        digits[k] %= 58;
      }

      while (carry) {
        digits.push(carry % 58);
        carry = (carry / 58) | 0;
      }
    }

    for (let i = 0; buffer[i] === 0 && i < buffer.length - 1; i++) {
      digits.push(0);
    }

    return digits
      .reverse()
      .map((digit) => {
        return this.alphabet[digit];
      })
      .join('');
  }

  decode(hash: string, encoding: string): Uint8Array {
    switch (encoding) {
      case 'base64':
        return this.base64Decode(hash);
      case 'base58':
        return this.base58Decode(hash);
      case 'hex':
        return this.hexDecode(hash);
      default:
        throw new Error(`Unsupported encoding ${encoding}`);
    }
  }

  validateHash(hash, encoding) {
    const hashBytes = this.decode(hash, encoding);
    return this.allowsHashLengths.indexOf(hashBytes.length) !== -1;
  }

  base64Decode(hash) {
    const bytes = Buffer.from(hash, 'base64').toString('binary');
    return new Uint8Array(bytes.split('').map(charCodeAt));

    function charCodeAt(c) {
      return c.charCodeAt(0);
    }
  }

  /* @todo Use LTO crypt library for base58 */
  base58Decode(hash) {
    if (!hash.length) return new Uint8Array(0);

    const bytes = [0];

    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < hash.length; i++) {
      const c = hash[i];
      if (!(c in this.alphabetMap)) {
        throw new Error(`hash-encoder: there is no character "${c}" in the base58 sequence`);
      }

      for (let j = 0; j < bytes.length; j++) {
        bytes[j] *= 58;
      }

      bytes[0] += this.alphabetMap[c];
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

  hexDecode(hash) {
    const bytes = Buffer.from(hash, 'hex').toString('binary');
    return new Uint8Array(bytes.split('').map(charCodeAt));

    function charCodeAt(c) {
      return c.charCodeAt(0);
    }
  }
}
