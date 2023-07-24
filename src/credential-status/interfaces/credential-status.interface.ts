export interface CredentialStatusStatement {
  type: string;
  timestamp: number;
  signer: {
    did: string;
    type: string;
    publicKeyMultibase: string;
  };
  [_: string]: any;
}

export interface CredentialStatusStatementStored {
  type: number;
  timestamp: number;
  sender: string;
  [_: string]: any;
}
