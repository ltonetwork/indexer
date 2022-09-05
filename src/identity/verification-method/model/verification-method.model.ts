import { chainIdOf } from "@lto-network/lto-crypto";
import {KeyType, MethodMap} from "../enums/verification-method.enum";
import { DIDVerificationMethod } from "../../interfaces/identity.interface";

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

    public asDidMethod(publicKey: string, keyType = KeyType.ed25519): DIDVerificationMethod {
        return {
            id: `did:lto:${this.recipient}#sign`,
            type: keyType.toString(),
            controller: `did:lto:${this.recipient}`,
            publicKeyBase58: publicKey,
            blockchainAccountId: `${this.recipient}@lto:${chainIdOf(this.recipient)}`,
        };
    }

    public isAuthentication(): boolean {
        return (this.relationships & MethodMap.authentication) === MethodMap.authentication;
    }
    public isAssertionMethod(): boolean {
        return (this.relationships & MethodMap.assertionMethod) === MethodMap.assertionMethod;
    }
    public isKeyAgreement(): boolean {
        return (this.relationships & MethodMap.keyAgreement) === MethodMap.keyAgreement;
    }
    public isCapabilityInvocation() {
        return (this.relationships & MethodMap.capabilityInvocation) === MethodMap.capabilityInvocation;
    }
    public isCapabilityDelegation() {
        return (this.relationships & MethodMap.capabilityDelegation) === MethodMap.capabilityDelegation;
    }
}
