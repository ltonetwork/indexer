export enum RelationshipType {
  authentication = 0x0101,
  assertionMethod = 0x0102,
  keyAgreement = 0x0104,
  capabilityInvocation = 0x0108,
  capabilityDelegation = 0x0110,
}

export type Relationship = keyof typeof RelationshipType;

export enum KeyType {
  ed25519 = 'Ed25519VerificationKey2020',
  x25519 = 'X25519KeyAgreementKey2019',
  secp256k1 = 'EcdsaSecp256k1VerificationKey2019',
  secp256r1 = 'EcdsaSecp256r1VerificationKey2019',
}
