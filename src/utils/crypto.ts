import { base58 } from '@scure/base';
import { concatBytes } from '@noble/hashes/utils';
import { sha256 } from '@noble/hashes/sha256';
import { blake2b } from '@noble/hashes/blake2b';

export function networkId(address: string): string {
  return String.fromCharCode(base58.decode(address)[1]);
}

function secureHash(input: Uint8Array): Uint8Array {
  return sha256(blake2b(input));
}

export function buildAddress(publicKey: Uint8Array | string, networkId: string): string {
  const publicKeyBytes = typeof publicKey === 'string' ? base58.decode(publicKey) : publicKey;

  const prefix = new Uint8Array([1, networkId.charCodeAt(0)]);
  const publicKeyHashPart = secureHash(publicKeyBytes).slice(0, 20);
  const rawAddress = concatBytes(prefix, publicKeyHashPart);
  const addressHash = secureHash(rawAddress).slice(0, 4);

  return base58.encode(concatBytes(rawAddress, addressHash));
}
