export interface CredentialStatusStatementStored {
  type: number;
  timestamp: number;
  sender: string;
  [_: string]: any;
}

export interface CredentialStatusStatement {
  type: string;
  timestamp: string;
  signer: {
    id: string;
    type: string;
    publicKeyMultibase: string;
  };
  [_: string]: any;
}

export interface CredentialStatus {
  id: string;
  issuer?: string;
  statements: CredentialStatusStatement[];
  issued?: string;
  suspended?: string;
  revoked?: string;
}
