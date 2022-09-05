export interface Transaction {
  readonly id: string;
  readonly type: number;
  readonly sender: string;
  readonly senderKeyType: string;
  readonly senderPublicKey: string;
  readonly recipient?: string;
  readonly fee: number;
  readonly timestamp: number;
  readonly proofs: string[];
  readonly version: number;
  readonly data?: Array<{
    key: string;
    type: string;
    value: string;
  }>;
  readonly anchors?: Array<string>;
  readonly transfers: Array<{
    recipient: string;
    amount: number;
  }>;
  readonly associationType?: number;
  readonly hash?: string;
  readonly accounts?: Array<{
    keyType: string;
    publicKey: string;
  }>;
}
