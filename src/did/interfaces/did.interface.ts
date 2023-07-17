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
  service?: DIDDocumentService[];
}

export interface DIDResolution {
  '@context': string;
  didDocument: DIDDocument | Record<string, never>;
  didDocumentMetadata:
    | {
        created: string;
        updated?: string;
        deactivated: boolean;
        deactivatedBy?: string;
        nextUpdate?: string;
        lastUpdate?: string;
      }
    | Record<string, never>;
  didResolutionMetadata: {
    error?: string;
    method?: 'lto';
    networkId?: string;
  };
}

export interface DIDDocumentService {
  id: string;
  type: string;
  serviceEndpoint: string | Record<string, any> | Array<string | Record<string, any>>;
  [key: string]: any;
}
