import {Injectable} from '@nestjs/common';
import {NodeService} from '../node/node.service';
import {EncoderService} from '../encoder/encoder.service';
import {ConfigService} from '../config/config.service';
import {LoggerService} from "../logger/logger.service";
import {Request, Response} from "express";
import {StorageService} from "../storage/storage.service";

@Injectable()
export class HashService
{
    private hashes = [];

    constructor(
        private readonly config: ConfigService,
        private readonly node: NodeService,
        private readonly encoder: EncoderService,
        private readonly storage: StorageService,
    ) { }

    async anchor(
        hash: string,
        encoding: string,
    ): Promise<{
        '@context';
        type;
        targetHash;
        anchors;
    } | null> {
        if (this.config.isAnchorBatched()) {
            const hashBase58 = this.encoder.base58Encode(this.encoder.decode(hash, encoding));
            if (!this.hashes.includes(hashBase58)) {
                this.hashes.push(hashBase58);
            }
            return null;
        }

        return await this.node.anchor(hash, encoding);
    }

    async trigger(): Promise<void> {
        const hashes = this.hashes;
        this.hashes = [];

        if (hashes.length === 0) return;

        const chunks = [...Array(Math.ceil(hashes.length / 100))].map(_ => hashes.splice(0, 100));
        await Promise.all(chunks.map(chunk => this.node.anchorAll(...chunk).catch(() => {})));
    }

    async verifyAnchors(
        hashes: Array<string>,
        encoding: string,
    ): Promise<{ verified: boolean, anchors: {[key: string]: boolean} }> {
        const promises: Array<Promise<[string, boolean]>> = hashes.map(hash => {
            const hashHex = this.encoder.hexEncode(this.encoder.decode(hash, encoding));
            return this.storage.getAnchor(hashHex).then((info: { id: string }) => [hash, !!info.id]);
        });

        const result = Object.fromEntries(await Promise.all(promises));

        return {
            verified: Object.values(result).every(b => b),
            anchors: result,
        };
    }

    async verifyMappedAnchors(
        hashes: {[key: string]: string},
        encoding: string,
    ): Promise<{ verified: boolean, anchors: {[key: string]: object|null} }> {
        const promises = Object.entries(hashes).map(([key, value]) => {
            const keyHex = this.encoder.hexEncode(this.encoder.decode(key, encoding));
            return this.storage.getMappedAnchorsByKey(keyHex)
                .then(set => this.processMappedAnchor(set, key, value, encoding));
        });
        const result = await Promise.all(promises);

        return {
            verified: result.every(({verified}) => verified),
            anchors: Object.fromEntries(result.map(({key, anchors}) => [key, anchors])),
        };
    }

    private processMappedAnchor(
        set: {anchor: string, sender: string, timestamp: number, blockHeight: number, position: number}[],
        key: string,
        value: string|null,
        encoding: string,
    ): { verified: boolean, key: string, anchors: Array<any> } {
        const anchors = set
            .sort((a, b) => b.blockHeight - a.blockHeight || b.position - a.position)
            .map(info => ({
                anchor: this.encoder.encode(this.encoder.hexDecode(info.anchor), encoding),
                sender: info.sender,
            }));

        if (value === null) {
            return { key, verified: anchors.length === 0, anchors };
        }

        const index = anchors.findIndex(info => info.anchor.toLowerCase() === value.toLowerCase());
        if (index >= 0) anchors.splice(index + 1);

        return { key, verified: index >= 0, anchors };
    }
}
