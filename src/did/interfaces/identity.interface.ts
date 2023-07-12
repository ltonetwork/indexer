export interface DIDVerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyMultibase: string;
}

export interface DIDDocument {
  '@context': string;
  id: string;
  verificationMethod: DIDVerificationMethod[];
  authentication?: string[];
  assertionMethod?: string[];
  keyAgreement?: Array<string | DIDVerificationMethod>;
  capabilityInvocation?: Array<string | DIDVerificationMethod>;
  capabilityDelegation?: string[];
}

export interface DIDResolution {
  '@context': string;
  didDocument: DIDDocument | {};
  didDocumentMetadata: {
    created: string;
    updated: boolean;
    deactivated: boolean;
    nextUpdate?: string;
  } | {};
  didResolutionMetadata: {
    error?: string;
    method?: 'lto';
    networkId?: string;
  };
}
