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
  readonly amount?: number;
  readonly data?: Array<{
    key: string;
    type: string;
    value: string | number | boolean;
  }>;
  readonly anchors?: string[] | { [_: string]: string };
  readonly transfers: Array<{
    recipient: string;
    amount: number;
  }>;
  readonly associationType?: number;
  readonly statementType?: number;
  readonly hash?: string;
  readonly accounts?: Array<{
    keyType: string;
    publicKey: string;
  }>;
  readonly leaseId?: string;
  readonly expires?: number;
}
