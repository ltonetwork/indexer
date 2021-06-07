import { chainIdOf } from "@lto-network/lto-crypto";
import { DIDVerificationMethod } from "identity/interfaces/identity.interface";

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
        const result = 0x0101 | this.relationships;
        return result == this.relationships;
    }
    public isAssertionMethod() {
        const result = 0x0102 | this.relationships;
        return result == this.relationships;
    }
    public isKeyAgreement() {
        const result = 0x0104 | this.relationships;
        return result == this.relationships;
    }
    public isCapabilityInvocation() {
        const result = 0x0108 | this.relationships;
        return result == this.relationships;
    }
    public isCapabilityDelegation() {
        const result = 0x0110 | this.relationships;
        return result == this.relationships;
    }
}
