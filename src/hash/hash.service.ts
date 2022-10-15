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
    ): Promise<{ verified: boolean, anchors: {[key: string]: string|null} }> {
        const promises: Array<Promise<{key: string, anchor: string|null, verified: boolean}>> = [];

        for (const [key, value] of Object.entries(hashes)) {
            const keyHex = this.encoder.hexEncode(this.encoder.decode(key, encoding));
            promises.push(this.storage.getMappedAnchor(keyHex).then(info => {
                const anchor = info.anchor ? this.encoder.encode(this.encoder.hexDecode(info.anchor), encoding) : null;
                return { key, anchor, verified: anchor === value};
            }));
        }

        const result = await Promise.all(promises);

        return {
            verified: result.every(({verified}) => verified),
            anchors: Object.fromEntries(result.map(({key, anchor}) => [key, anchor])),
        };
    }
}
