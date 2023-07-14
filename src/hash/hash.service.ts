import {Injectable} from '@nestjs/common';
import {NodeService} from '../node/node.service';
import {EncoderService} from '../common/encoder/encoder.service';
import {ConfigService} from '../common/config/config.service';
import {StorageService} from '../storage/storage.service';

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
    ): Promise<{ verified: boolean, anchors: Record<string, string|null>}> {
        const promises: Array<Promise<[string, string | undefined]>> = hashes.map(hash => {
            const hashHex = this.encoder.hexEncode(this.encoder.decode(hash, encoding));
            return this.storage.getAnchor(hashHex).then((info: { id: string }) => [hash, info?.id || null]);
        });

        const result = await Promise.all(promises);

        return {
            verified: result.every(([, txId]) => !!txId),
            anchors: Object.fromEntries(result),
        };
    }

    async verifyMappedAnchors(
        hashes: {[key: string]: string|{hash: string, sender?: string|string[]}},
        encoding: string,
    ): Promise<{ verified: boolean, map: Record<string, string|null>, anchors: Record<string, string|null> }> {
        const promises = Object.entries(hashes).map(([key, value]) => {
            const keyHex = this.encoder.hexEncode(this.encoder.decode(key, encoding));
            const {hash, sender = null} = typeof value === 'object' && value !== null ? (value as any) : {hash: value};
            return this.storage.getMappedAnchorsByKey(keyHex)
                .then(set => this.processMappedAnchor(set, key, hash, encoding, sender));
        });
        const result = await Promise.all(promises);

        return {
            verified: result.every(({verified}) => verified),
            map: Object.fromEntries(result.map(({key, hash}) => [key, hash])),
            anchors: Object.fromEntries(result.map(({key, txId}) => [key, txId])),
        };
    }

    private processMappedAnchor(
        set: {hash: string, id: string, sender: string, timestamp: number, blockHeight: number, position: number}[],
        key: string,
        value: string|null,
        encoding: string,
        sender?: string|string[],
    ): { verified: boolean, key: string, hash: string|null, txId: string|null } {
        if (sender) {
            const senders = (typeof sender === 'string') ? [sender] : sender;
            set = set.filter(info => senders.includes(info.sender));
        }

        const {hash: hashHex, id} = set
            .sort((a, b) => b.blockHeight - a.blockHeight || b.position - a.position)
            [0] || {hash: null, id: null};
        const hash = hashHex ? this.encoder.encode(this.encoder.hexDecode(hashHex), encoding) : null;

        return { key, verified: hash === value, hash, txId: id };
    }
}
