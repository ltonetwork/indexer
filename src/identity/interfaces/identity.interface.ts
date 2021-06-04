import { DIDVerificationMethod } from "verification-method/model/verification-method.model";

export interface DIDDocument {
  '@context': string;
  id: string;
  verificationMethod: DIDVerificationMethod[];
  authentication?: string[];
  assertionMethod?: string[];
  keyAgreement?: string[];
  capabilityInvocation?: string[];
  capabilityDelegation?: string[];
}