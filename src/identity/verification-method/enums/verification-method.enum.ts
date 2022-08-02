export enum MethodMap {
  authentication = 0x0101,
  assertionMethod = 0x0101,
  keyAgreement = 0x0104,
  capabilityInvocation = 0x0108,
  capabilityDelegation = 0x0110,
}

export enum KeyType {
  ed25519 = 'Ed25519VerificationKey2018',
  secp256k1 = 'EcdsaSecp256k1VerificationKey2019',
}
