/**
 * Set app routes
 */

const config = require('./config.js')();
const getNodeWalletData = require('./node-wallet-data.js');
const dataTransactionAnchor = require('./data-transaction-anchor.js');

module.exports = function(app) {    
    app.post('/hash', (request, response, next) => {
        const hash = request.body.hash;
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
            .then(transactionId => response.json({ transactionId }))
            .catch(error => next(error));   
    });
}
