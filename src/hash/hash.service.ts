import {Injectable} from '@nestjs/common';
import {NodeService} from '../node/node.service';
import {EncoderService} from '../encoder/encoder.service';
import {ConfigService} from '../config/config.service';

@Injectable()
export class HashService
{
    private hashes;

    constructor(
        private readonly config: ConfigService,
        private readonly node: NodeService,
        private readonly encoder: EncoderService,
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
            this.hashes.push(this.encoder.base58Encode(this.encoder.decode(hash, encoding)));
            return null;
        }

        return await this.node.anchor(hash, encoding);
    }

    async trigger(): Promise<void>
    {
        if (this.hashes.length === 0) return;

        const chunks = [...Array(Math.ceil(this.hashes.length / 100))].map(_ => this.hashes.splice(0, 100));
        await Promise.all(chunks.map(chunk => this.node.anchorAll(...chunk)));
    }
}
