import { chainIdOf } from "@lto-network/lto-crypto";
import { MethodMap } from "../enums/verification-method.enum";
import { DIDVerificationMethod } from "../../identity/interfaces/identity.interface";

export interface MethodObject {
    sender: string;
    recipient: string;
    relationships: number;
    createdAt: number;
    revokedAt?: number;
}

export class VerificationMethod {
    public sender: string;
    public recipient: string;
    public createdAt?: number;
    public revokedAt?: number;
    private relationships: number;

    constructor(relationships: number, sender: string, recipient: string, createdAt: number, revokedAt?: number) {
        this.sender = sender;
        this.createdAt = createdAt;
        this.recipient = recipient;
        this.relationships = relationships;

        if (revokedAt) this.revokedAt = revokedAt;
    }

    public json(): MethodObject {
        const asJson: MethodObject = {
            sender: this.sender,
            createdAt: this.createdAt,
            recipient: this.recipient,
            relationships: this.relationships,
        };

        if (this.revokedAt) asJson.revokedAt = this.revokedAt;

        return asJson;
    }

    public asString(): string {
        return JSON.stringify(this.json());
    }

    public asDidMethod(publicKey: string): DIDVerificationMethod {
        return {
            id: `did:lto:${this.recipient}#sign`,
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
