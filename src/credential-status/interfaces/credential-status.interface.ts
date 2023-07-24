export interface CredentialStatusStatementStored {
  type: number;
  timestamp: number;
  sender: string;
  [_: string]: any;
}

export interface CredentialStatusStatement {
  type: string;
  timestamp: number;
  signer: {
    id: string;
    type: string;
    publicKeyMultibase: string;
  };
  [_: string]: any;
}

export interface CredentialStatus {
  id: string;
  statements: CredentialStatusStatement[];
}
