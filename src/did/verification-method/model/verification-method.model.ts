import { KeyType, RelationshipType } from './verification-method.types';
import { DIDVerificationMethod } from '../../interfaces/did.interface';
import { base58 } from '@scure/base';

export class VerificationMethod {
  constructor(
    public relationships: number,
    public recipient: string,
    public timestamp: number,
    public expires?: number,
  ) {}

  public asDidMethod(publicKey: string, keyType = KeyType.ed25519): DIDVerificationMethod {
    const tag = keyType === KeyType.x25519 ? '#encrypt' : '#sign';

    return {
      id: `did:lto:${this.recipient}${tag}`,
      type: keyType.toString(),
      controller: `did:lto:${this.recipient}`,
      publicKeyMultibase: 'z' + publicKey,
    };
  }

  public toBuffer() {
    const buf = Buffer.alloc(46);
    buf.writeUInt32BE(this.relationships, 0);
    Buffer.from(base58.decode(this.recipient)).copy(buf, 4, 0, 26);
    buf.writeBigUInt64BE(BigInt(this.timestamp), 30);
    buf.writeBigUInt64BE(BigInt(this.expires ?? 0), 38);

    return buf;
  }

  public static from(buf: Buffer): VerificationMethod {
    const relationships = buf.readUInt32BE(0);
    const recipient = base58.encode(buf.slice(4, 30));
    const timestamp = Number(buf.readBigUInt64BE(30));
    const expires = Number(buf.readBigUInt64BE(38));

    return new VerificationMethod(relationships, recipient, timestamp, expires || undefined);
  }

  private bitCompare(set: number, mask: number): boolean {
    return (set & mask) === mask;
  }

  public isAuthentication(): boolean {
    return this.bitCompare(this.relationships, RelationshipType.authentication);
  }

  public isAssertionMethod(): boolean {
    return this.bitCompare(this.relationships, RelationshipType.assertionMethod);
  }

  public isKeyAgreement(): boolean {
    return this.bitCompare(this.relationships, RelationshipType.keyAgreement);
  }

  public isCapabilityInvocation() {
    return this.bitCompare(this.relationships, RelationshipType.capabilityInvocation);
  }

  public isCapabilityDelegation() {
    return this.bitCompare(this.relationships, RelationshipType.capabilityDelegation);
  }

  public isOnlyDeactivateCapability() {
    return this.relationships === 0x1108;
  }

  public isActive(timestamp: Date | number) {
    const now = timestamp instanceof Date ? timestamp.getTime() : timestamp;
    return this.relationships > 0 && this.timestamp <= now && (!this.expires || this.expires >= now);
  }
}
