import { base58 } from '@scure/base';

export class CredentialStatus {
  constructor(public readonly type: number, public readonly sender: string, public readonly timestamp: number) {}

  public toBuffer() {
    const buf = Buffer.alloc(46);
    buf.writeUInt32BE(this.type, 0);
    Buffer.from(base58.decode(this.sender)).copy(buf, 4, 0, 26);
    buf.writeBigUInt64BE(BigInt(this.timestamp), 30);

    return buf;
  }

  public static from(buf: Buffer): CredentialStatus {
    const type = buf.readUInt32BE(0);
    const sender = base58.encode(buf.slice(4, 30));
    const timestamp = Number(buf.readBigUInt64BE(30));

    return new CredentialStatus(type, sender, timestamp);
  }
}
