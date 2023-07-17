import { base58 } from '@scure/base';
import { concatBytes } from '@noble/hashes/utils';
import { sha256 } from '@noble/hashes/sha256';
import { blake2b } from '@noble/hashes/blake2b';

export function networkId(address: string): string {
  return String.fromCharCode(base58.decode(address)[1]);
}

function secureHash(input: Uint8Array): Uint8Array {
  return sha256(blake2b(input, { dkLen: 32 }));
}

export function buildAddress(publicKey: Uint8Array | string, networkId: string): string {
  const publicKeyBytes = typeof publicKey === 'string' ? base58.decode(publicKey) : publicKey;

  const prefix = new Uint8Array([0x1, networkId.charCodeAt(0)]);
  const publicKeyHashPart = secureHash(publicKeyBytes).slice(0, 20);
  const rawAddress = concatBytes(prefix, publicKeyHashPart);
  const addressHash = secureHash(rawAddress).slice(0, 4);

  return base58.encode(concatBytes(rawAddress, addressHash));
}

export function isValidAddress(address: string, networkId?: string | number): boolean {
  if (!address || typeof address !== 'string') throw new Error('Missing or invalid address');

  const networkByte = typeof networkId === 'string' ? networkId.charCodeAt(0) : networkId;
  const addressBytes = base58.decode(address);

  if (addressBytes[0] !== 0x1 /* address version */) return false;
  if (networkByte !== undefined && addressBytes[1] !== networkByte) return false;

  const key = addressBytes.slice(0, 22);
  const check = addressBytes.slice(22, 26);
  const keyHash = secureHash(key).slice(0, 4);

  return keyHash.length === check.length && keyHash.every((c, i) => c === check[i]);
}
