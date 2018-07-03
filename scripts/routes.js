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

    redis.get(hash, (error, data) => {
        console.log('obtained from redis: ', data);
        if (error) return next('Error while getting hash ' + key + ' from db: ' + error);

        response.json({ transaction: data });
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
            config.dataHash = Buffer.from(hash).toString('base64');
            config.walletSeed = data.walletSeed;
            config.senderAdress = data.senderAdress;

            return dataTransactionAnchor(config);
        })
        .then(transaction => response.json({ transaction }))
        .catch(error => next(error));   
}
