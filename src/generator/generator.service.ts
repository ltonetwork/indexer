import { Injectable } from '@nestjs/common';
import { NodeService } from '../node/node.service';
import {ConfigService} from '../config/config.service';
import {Block, BlockHeader} from '../interfaces/block.interface';
import AwaitLock from 'await-lock';

export interface GeneratorStats {
    blocks: number;
    reward: number;
    balance: number;
    share: number;
}

@Injectable()
export class GeneratorService {
    private readonly delta;
    private generators: {[_: string]: GeneratorStats} = {};
    private previousGenerator: string;
    private writeLock: AwaitLock = new AwaitLock();

    constructor(
        private readonly node: NodeService,
        config: ConfigService,
    ) {
        this.delta = config.getGeneratorIndexingDelta();
    }

    async calculate(blockHeight: number) {
        await this.writeLock.acquireAsync();

        try {
            await this.calculateMined(blockHeight);
            await this.updateBalances(Object.keys(this.generators));
            this.updateShare();
        } finally {
            this.writeLock.release();
        }
    }

    async update(block: Block) {
        await this.writeLock.acquireAsync();

        try {
            const modified = new Set(this.modifiedBalances(block).filter(address => !!this.generators[address]));
            modified.add(this.previousGenerator);

            if (block.height - this.delta > 0) {
                const oldBlock = await this.node.getBlock(block.height - this.delta);
                await this.removeMined(oldBlock);
                modified.add(oldBlock.generator);
            }

            await this.addMined(block);

            await this.updateBalances(Array.from(modified));
            this.updateShare();

            this.previousGenerator = block.generator;
        } finally {
            this.writeLock.release();
        }
    }

    private async calculateMined(blockHeight: number) {
        const blocks = await this.node.getBlockHeaders(blockHeight - this.delta + 1, blockHeight);

        for (const block of blocks) {
            if (!this.generators[block.generator]) {
                this.generators[block.generator] = {
                    blocks: 0,
                    reward: 0,
                    balance: 0,
                    share: 0,
                };
            }

            this.addMined(block);
        }

        this.previousGenerator = blocks[blocks.length - 1].generator;
    }

    private modifiedBalances(block: Block): string[] {
        return Array.from(new Set([
            block.generator,
            ...block.transactions.map(tx => tx.sender),
            ...block.transactions.filter(tx => !!tx.recipient).map(tx => tx.recipient),
        ]));
    }

    private removeMined(block: BlockHeader) {
        this.generators[block.generator].blocks--;
        this.generators[block.generator].reward -= block.generatorReward;
    }

    private addMined(block: BlockHeader) {
        this.generators[block.generator].blocks++;
        this.generators[block.generator].reward += block.generatorReward;
    }

    private async updateBalances(addresses: string[]) {
        const balances = await Promise.all(
            addresses.map(address => this.node.getBalanceDetails(address)),
        );

        for (const {address, generating} of balances) {
            this.generators[address].balance = generating;
        }
    }

    private updateShare() {
        const totalBalance = Object.values(this.generators).reduce((total, stats) => total + stats.balance, 0);

        for (const stats of Object.values(this.generators)) {
            stats.share = stats.balance / totalBalance;
        }
    }

}
