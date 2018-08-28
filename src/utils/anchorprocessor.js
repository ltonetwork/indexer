const request = require('request-promise');
const Redis = require('ioredis');
const logger = require('./logger');
const Hash = require('./hash');

const DATA_TRANSACTION_TYPE = 12;
const ANCHOR = '\u2693';

class Anchorprocessor {

  constructor(config, interval) {
    this.nodeUrl = config.nodeAddress;
    if (config.startingBlock === 'last') {
      this.getLastBlockHeight().then((height) => {
        this.lastBlock = height;
      });
    } else {
      this.lastBlock = config.startingBlock
    }

    this.interval = interval || 10000;

    this.client = Array.isArray(config.dbUrl) ? new Redis.Cluster(config.dbUrl) : new Redis(config.dbUrl);
  }

  startMonitor() {
    if (this.task == null) {
      this.task = setTimeout(this.runMonitor.bind(this), this.interval);
      logger.info(`Started processor`);
    } else {
      logger.warn('Processor already running');
    }
  }

  async runMonitor() {
    this.taskId = setTimeout(this.runMonitor.bind(this), this.interval);
    logger.debug('Run monitor');
    await this.checkNewBlock();
  }

  async checkNewBlock() {
    const currentHeight = await this.getLastBlockHeight();
    let lastHeight = await this.getProcessingHeight() + 1;

    for(;lastHeight<=currentHeight;lastHeight++) {
      let block = await this.getBlock(lastHeight);
      await this.processBlock(block);
      await this.saveProcessingHeight(lastHeight);
    }
    logger.debug(`Processed blocks to block: ${lastHeight}`);
  }

  stopMonitor() {
    clearTimeout(this.taskId);
  }

  async processBlock(block) {
    logger.debug(`Processing block: ${block.height}`);

    for(let transaction of block.transactions) {
      await this.processTransaction(transaction);
    }
  }

  async processTransaction(transaction) {
    const skip = !transaction ||
      transaction.type !== DATA_TRANSACTION_TYPE ||
      typeof transaction.data === 'undefined';

    if (skip) return null;

    for (var i = 0; i < transaction.data.length; i++) {
      var item = transaction.data[i];

      if (item.key === ANCHOR) {
        const value = item.value.replace('base64:', '');
        const hexHash = Hash.hexEncode(Hash.base64Decode(value));
        await this.saveAnchor(hexHash, transaction.id);
      }
    }
  }

  saveAnchor(hash, transactionId) {
    logger.info(`Save hash ${hash} with transactionId: ${transactionId}`);
    const key = `lto-anchor:anchor:${hash}`;
    return this.client.set(key, transactionId);
  }

  async getProcessingHeight() {
    let height = parseInt(await this.client.get(`lto-anchor:processing-height`));
    if (!height) {
      height = this.lastBlock;
    }

    return height;
  }

  saveProcessingHeight(height) {
    return this.client.set(`lto-anchor:processing-height`, height);
  }

  async getLastBlockHeight() {
    const block = await request({
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      uri: `${this.nodeUrl}/blocks/last`,
      method: 'GET',
      json: true
    });
    return block.height - 1;
  }

  getBlock(id) {
    return request({
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      uri: `${this.nodeUrl}/blocks/at/${id}` ,
      method: 'GET',
      json: true
    });
  }

  closeDB() {
    this.client.quit();
  }
}

module.exports = Anchorprocessor;