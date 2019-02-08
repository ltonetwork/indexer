/* tslint:disable:prefer-for-of no-bitwise */
import { Injectable, ClassProvider } from '@angular/core';
import { Buffer } from 'buffer';

export enum Encoding {
  base64 = 'base64',
  base58 = 'base58',
  hex = 'hex',
  binary = 'binary',
}

@Injectable({ providedIn: 'root' })
// tslint:disable:no-use-before-declare
export class EncoderService {
  private _alphabet =
    '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  private _alphabetMap: { [character: string]: number };

  constructor() {
    this._alphabetMap = this._alphabet
      .split('')
      .reduce((map, char, index) => ({ ...map, [char]: index }), {});
  }

  decode(hash: string, encoding: Encoding) {
    switch (encoding) {
      case Encoding.base64:
        return this.base64Decode(hash);
      case Encoding.base58:
        return this.base58Decode(hash);
      case Encoding.hex:
        return this.hexDecode(hash);
    }

    throw new Error(`Uncnown encoding: ${encoding}`);
  }

  validateSHA256(hash: string, encoding: Encoding) {
    const hashBytes = this.decode(hash, encoding);
    return hashBytes.length === 32;
  }

  base64Encode(buffer: number[]) {
    return Buffer.from(
      String.fromCharCode(...buffer),
      Encoding.binary,
    ).toString(Encoding.base64);
  }

  base64Decode(hash: string): Uint8Array {
    const bytes = Buffer.from(hash, Encoding.base64).toString(Encoding.binary);
    return new Uint8Array(bytes.split('').map(char => char.charCodeAt(0)));
  }

  base58Encode(buffer: number[]) {
    if (buffer.length === 0) {
      return '';
    }

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
      .map(digit => this._alphabet[digit])
      .join('');
  }

  base58Decode(hash: string) {
    if (!hash.length) {
      return new Uint8Array(0);
    }

    const bytes = [0];

    for (let i = 0; i < hash.length; i++) {
      const c = hash[i];
      if (!(c in this._alphabetMap)) {
        throw new Error(
          `hash-encoder: there is no character "${c}" in the base58 sequence`,
        );
      }

      for (let j = 0; j < bytes.length; j++) {
        bytes[j] *= 58;
      }

      bytes[0] += this._alphabetMap[c];
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

  hexEncode(buffer: number[]) {
    return Buffer.from(
      String.fromCharCode(...buffer),
      Encoding.binary,
    ).toString(Encoding.hex);
  }

  hexDecode(hash: string) {
    const bytes = Buffer.from(hash, Encoding.hex).toString(Encoding.binary);
    return new Uint8Array(bytes.split('').map(c => c.charCodeAt(0)));
  }
}
