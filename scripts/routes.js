/**
 * Set app routes
 */

const redis = require('redis').createClient();
const config = require('./config.js')();
const getNodeWalletData = require('./node-wallet-data.js');
const dataTransactionAnchor = require('./data-transaction-anchor.js');

module.exports = function(app) {    
    app.get('/:hash/verify', verifyAction);
    app.post('/:hash/save', saveAction);
}

//Check if hash is saved to blockchain
function verifyAction(request, response, next) {
    const hash = request.params.hash;
    if (!hash) {
        return next('Hash should not be empty');
    }

    console.log('searching for the hash: ', hash);

    redis.get(hash, (error, transactionId) => {
        console.log('obtained from redis: ', transactionId);
        if (error) return next('Error while getting hash ' + key + ' from db: ' + error);

        const checkpoint = asCheckpoint(hash, transactionId);
        response.json(checkpoint);
    });
}

//Post hash to data transaction
function saveAction(request, response, next) {
    const hash = request.params.hash;
    if (!hash) {
        return next('Hash should not be empty');
    }

    getNodeWalletData(config)
        .then(data => {
            config.dataHash = hash;
            config.walletSeed = data.walletSeed;
            config.senderAdress = data.senderAdress;

            return dataTransactionAnchor(config);
        })
        .then(transactionId => {
            const checkpoint = asCheckpoint(hash, transactionId);
            response.json(checkpoint)
        })
        .catch(error => next(error));   
}

//Build checkpoint for given hash
function asCheckpoint(hash, transactionId) {
    return {
        @context: 'https://w3id.org/chainpoint/v2',
        type: 'ChainpointSHA256v2',
        targetHash: hash,
        anchors: [{
            type: 'WAVESDataTransaction',
            sourceId: transactionId
        }]
    };
}
