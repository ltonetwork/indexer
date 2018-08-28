/**
 * Set app routes
 */

const router = require('express').Router();
const Redis = require('ioredis');
const logger = require('../utils/logger');
const config = require('config');

const Hash = require('../utils/hash');
const Node = require('../utils/node');
const node = new Node(config);

//Check if hash is saved to blockchain
router.get('/:hash', async (request, response, next) => {
  const hash = request.params.hash;
  if (!hash) {
    return next('Hash should not be empty');
  }

  logger.debug('searching for the hash: ', hash);

  const client = Array.isArray(config.dbUrl) ? new Redis.Cluster(config.dbUrl) : new Redis(config.dbUrl);

  try {
    const transactionId = await client.get(`lto-anchor:anchor:${hash}`);
    if (!transactionId) {
      return response.status(404).send({chainpoint: null});
    }

    logger.debug('obtained from redis: ', transactionId);
    const chainpoint = asChainpoint(hash, transactionId);
    response.json({chainpoint});

  } catch(error) {
    return next('Error while getting hash ' + hash + ' from db: ' + error);
  } finally {
    client.quit();
  }
});

router.get('/:hash/encoding/:encoding', async (request, response, next) => {
  const hash = request.params.hash;
  const encoding = request.params.encoding;
  if (!hash) {
    return next('Hash should not be empty');
  }

  if (!['base64', 'base58', 'hex'].includes(encoding)) {
    return next('Invalid encoding given');
  }

  const hexHash = Hash.hexEncode(Hash.decode(hash, encoding));
  const client = Array.isArray(config.dbUrl) ? new Redis.Cluster(config.dbUrl) : new Redis(config.dbUrl);

  try {
    const transactionId = await client.get(`lto-anchor:anchor:${hexHash}`);
    if (!transactionId) {
      return response.status(404).send({chainpoint: null});
    }

    logger.debug('obtained from redis: ', transactionId);
    const chainpoint = asChainpoint(hexHash, transactionId);
    response.json({chainpoint});

  } catch(error) {
    return next('Error while getting hash ' + hexhash + ' from db: ' + error);
  } finally {
    client.quit();
  }
});

//Post hash to data transaction
router.post('/', async (req, res, next) => {
  const hash = req.body.hash;
  const encoding = req.body.encoding || 'hex';

  if (!hash) {
    return next('Hash should not be empty');
  }

  if (!['base64', 'base58', 'hex'].includes(encoding)) {
    return next('Invalid encoding given');
  }

  if (!Hash.validateSHA256(hash, encoding)) {
    return next('Invalid hash given');
  }

  const base64Hash = Hash.base64Encode(Hash.decode(hash, encoding));

  try {
    const senderAddress = await node.getNodeWalletAddress();
    const transactionId = await node.createAnchorTransaction(senderAddress, base64Hash);
    const chainpoint = transactionId ? asChainpoint(hash, transactionId) : null;
    res.json({chainpoint})
  } catch (error) {
    next(error);
  }
});

//Build chainpoint for given hash
asChainpoint = (hash, transactionId) => {
  return {
    '@context': 'https://w3id.org/chainpoint/v2',
    type: 'ChainpointSHA256v2',
    targetHash: hash,
    anchors: [{
      type: 'LTODataTransaction',
      sourceId: transactionId
    }]
  };
};

module.exports = router;
