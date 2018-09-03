/**
 * Set app routes
 */

const router = require('express').Router();
const logger = require('../utils/logger');
const config = require('config');

const Hash = require('../utils/hash');
const Node = require('../utils/node');
const node = new Node(config);

const client = require('../utils/redis-client');

/**
 * @swagger
 * definition:
 *   Hash:
 *     properties:
 *       hash:
 *         type: string
 *       encoding:
 *         type: string
 */

/**
 * @swagger
 * /hash/{hash}:
 *   get:
 *     tags:
 *       - Hash
 *     summary: Verify if your has is anchored
 *     parameters:
 *       - in: path
 *         name: hash
 *         type: string
 *         required: true
 *         description: Hash you wish to verify
 *     responses:
 *       200:
 *         description: chain object
 *       404:
 *         description: if the hash is not found
 */
router.get('/:hash', async (request, response, next) => {
  const hash = request.params.hash;
  if (!hash) {
    return next('Hash should not be empty');
  }

  logger.debug('searching for the hash: ', hash);

  try {
    const transactionId = await client.get(`lto-anchor:anchor:${hash.toLowerCase()}`);
    if (!transactionId) {
      return response.status(404).send({chainpoint: null});
    }

    logger.debug('obtained from redis: ', transactionId);
    const chainpoint = asChainpoint(hash, transactionId);
    response.json({chainpoint});

  } catch(error) {
    return next('Error while getting hash ' + hash + ' from db: ' + error);
  }
});

/**
 * @swagger
 * /hash/{hash}/encoding/{encoding}:
 *   get:
 *     tags:
 *       - Hash
 *     summary: Verify if your has is anchored
 *     parameters:
 *       - in: path
 *         name: hash
 *         type: string
 *         required: true
 *         description: Hash you wish to verify
 *       - in: path
 *         name: encoding
 *         type: string
 *         required: true
 *         description: The encoding of the hash
 *     responses:
 *       200:
 *         description: chain object
 *       404:
 *         description: if the hash is not found
 */
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
  }
});

/**
 * @swagger
 * /hash:
 *   post:
 *     tags:
 *       - Hash
 *     summary: Anchor your hash to the LTO Chain
 *     parameters:
 *       - in: body
 *         name: hash
 *         schema:
 *           $ref: '#/definitions/Hash'
 *         required: true
 *         description: Hash you wish to verify
 *     responses:
 *       200:
 *         description: chain object
 */
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
