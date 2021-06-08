import { chainIdOf } from "@lto-network/lto-crypto";
import { DIDVerificationMethod } from "identity/interfaces/identity.interface";

export enum MethodMap {
    authentication = 0x0101,
    assertionMethod = 0x0101,
    keyAgreement = 0x0104,
    capabilityInvocation = 0x0108,
    capabilityDelegation = 0x0110,
};

export class VerificationMethod {
    private relationships: number;
    private sender: string;
    private recipient: string;

    constructor(relationships: number, sender: string, recipient: string) {
        this.sender = sender;
        this.recipient = recipient;
        this.relationships = relationships;
    }

    public json(): { sender: string, recipient: string, relationships: number } {
        return {
            sender: this.sender,
            recipient: this.recipient,
            relationships: this.relationships
        }
    }

    public asDidMethod(publicKey: string): DIDVerificationMethod {
        return {
            id: `did:lto:${this.recipient}#key`,
            type: 'Ed25519VerificationKey2018',
            controller: `did:lto:${this.recipient}`,
            publicKeyBase58: publicKey,
            blockchainAccountId: `${this.recipient}@lto:${chainIdOf(this.recipient)}`,
        }
    }

    public isAuthentication() {
        const result = MethodMap.authentication | this.relationships;
        return result == this.relationships;
    }
    public isAssertionMethod() {
        const result = MethodMap.assertionMethod | this.relationships;
        return result == this.relationships;
    }
    public isKeyAgreement() {
        const result = MethodMap.keyAgreement | this.relationships;
        return result == this.relationships;
    }
    public isCapabilityInvocation() {
        const result = MethodMap.capabilityInvocation | this.relationships;
        return result == this.relationships;
    }
    public isCapabilityDelegation() {
        const result = MethodMap.capabilityDelegation | this.relationships;
        return result == this.relationships;
    }
}
