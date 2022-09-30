import {Injectable} from '@nestjs/common';
import {NodeService} from '../node/node.service';
import {EncoderService} from '../encoder/encoder.service';
import {ConfigService} from '../config/config.service';
import {LoggerService} from "../logger/logger.service";

@Injectable()
export class HashService
{
    private hashes = [];

    constructor(
        private readonly config: ConfigService,
        private readonly node: NodeService,
        private readonly encoder: EncoderService,
        private readonly logger: LoggerService,
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
        await Promise.all(chunks.map(chunk =>
            this.node.anchorAll(...chunk).catch(() => {})
        ));
    }
}
