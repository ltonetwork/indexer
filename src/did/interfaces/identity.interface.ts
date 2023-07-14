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
  service?: DIDService[];
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

export interface DIDService {
  id: string;
  type: string;
  serviceEndpoint: string | Record<string, any> | Array<string | Record<string, any>>;
  [key: string]: any;
}
