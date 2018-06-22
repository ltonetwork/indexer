'use strict'

const type = process.env.RUN_TYPE;
var params = null;

console.log('run script: ', type, "\n");

switch(type) {
    case 'wavesTransaction':
        const wavesTransaction = require('./scripts/waves-transaction.js');
        params = {
            walletSeed: process.env.SOURCE_WALLET_SEED,
            recipient: process.env.RECIPIENT_WALLET_ADRESS,
            tokenName: process.env.TOKEN_NAME,
            tokenDesc: process.env.TOKEN_DESC,
            tokenQuantity: process.env.TOKEN_QUANTITY,
            wavesAmount: process.env.TRANSACTION_WAVES_AMOUNT        
        };

        wavesTransaction(params);
    case 'dataTransaction':        
        const dataTransaction = require('./scripts/data-transaction.js');
        params = {
            walletSeed: process.env.SOURCE_WALLET_SEED
        };

        dataTransaction(params);
    case 'dataTransactionAnchor':        
        const dataTransactionAnchor = require('./scripts/data-transaction-anchor.js');
        params = {
            walletSeed: process.env.SOURCE_WALLET_SEED
        };

        dataTransactionAnchor(params);
}
