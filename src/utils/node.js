const request = require('request-promise');
const logger = require('./logger');

class Node {

  constructor(params) {
    this.nodeUrl = params.nodeAddress;
    this.apiSecret = params.apiSecret;
  }

  async getNodeWalletAddress() {

    logger.debug('request to get list of node\'s addresses');

    const response = await request({
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      uri: this.nodeUrl + '/addresses',
      method: 'GET',
      json: true
    });

    logger.debug('response: ', response);
    if (!response.length) throw new Error('No addresses in node\'s wallet');

    return response[0];
  }

  createAnchorTransaction(senderAddress, hash) {
    logger.debug('transaction params: ', {senderAddress, hash});
    const transaction = this.createTransactionData(senderAddress, hash);
    return this.sendTransaction(transaction);
  }

  //Create transaction data
  createTransactionData(senderAddress, dataHash) {

    const hash = dataHash;
    return {
      version: 1,
      type: 12,
      sender: senderAddress,
      data: [
        {key: '\u2693', type: 'binary', value: 'base64:' + hash}
      ],
      fee: 100000,
      timestamp: Date.now()
    };
  }

  async sendTransaction(data) {
    logger.debug('send data: ', data);

    const response = await request({
      headers: {
        'X-Api-Key': this.apiSecret,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      uri: this.nodeUrl + '/addresses/data',
      body: data,
      method: 'POST',
      json:true
    });

    logger.debug('response: ', response);

    if (response.error) {
      const message = response.message ? response.message : response.error;
      throw new Error(message);
    }

    return response.id;
  }

}

module.exports = Node;