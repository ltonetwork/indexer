export interface DIDVerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyBase58: string;
  blockchainAccountId: string;
};

export interface DIDDocument {
  '@context': string;
  id: string;
  verificationMethod: DIDVerificationMethod[];
  authentication?: string[];
  assertionMethod?: string[];
  keyAgreement?: DIDVerificationMethod[];
  capabilityInvocation?: string[];
  capabilityDelegation?: string[];
};
