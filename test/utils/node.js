const Node = require('../../src/utils/node');
const { expect } = require('chai');
const config = require('config');
const crypto = require('crypto');
const Hash = require('../../src/utils/hash');
const nock = require('nock');

describe('Node', () => {

  describe('checkUnconfirmedAnchors', () => {

    it('should return transactions of unconfirmed transactions', async () => {

      nock('http://public-node:6869')
        .head(`/`)
        .reply(200)
        .get(`/transactions/unconfirmed`)
        .reply(200, [{
            type: 12,
            id: '1',
            sender: 'sender-address',
            senderPublicKey: 'sender-public-key',
            fee: 100000,
            timestamp: 1536320200950,
            proofs: ['some-proof'],
            version: 1,
            data: [{
              key: '⚓',
              type: 'binary',
              value: 'base64:n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg='
            }]
          }]
        )
        .get(`/organizations/`)
        .reply(200, []);

      const text = 'test';
      const hash = Hash.base64Encode(crypto.createHash('sha256')
        .update(text)
        .digest());

      const node = new Node(config);
      const transactionId = await node.getUnconfirmedAnchor(hash);
      expect(transactionId).to.eq('1');
    });
  });
});