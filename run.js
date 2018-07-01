'use strict'

const getNodeWalletSeed = require('./scripts/node-wallet-info.js');
const type = process.env.RUN_TYPE;
const wavesConfig = { 
    minimumSeedLength: 25,
    requestOffset: 0,
    requestLimit: 100,
    logLevel: 'warning',
    timeDiff: 0,
    networkByte: 84,
    nodeAddress: 'http://127.0.0.1:6869',
    matcherAddress: 'http://127.0.0.1:6886' 
};

var path = null;
var params = null;

console.log('run script: ', type, "\n");

switch(type) {
    case 'wavesTransaction':
        path = './scripts/waves-transaction.js';
        params = {
            wavesConfig: wavesConfig,
            walletSeed: process.env.SOURCE_WALLET_SEED,
            recipient: process.env.RECIPIENT_WALLET_ADRESS,
            tokenName: process.env.TOKEN_NAME,
            tokenDesc: process.env.TOKEN_DESC,
            tokenQuantity: process.env.TOKEN_QUANTITY,
            wavesAmount: process.env.TRANSACTION_WAVES_AMOUNT        
        };
    break;
    case 'dataTransaction':        
        path = './scripts/data-transaction.js';
        params = {
            wavesConfig: wavesConfig,
            walletSeed: process.env.SOURCE_WALLET_SEED
        };
    break;
    case 'dataTransactionAnchor':        
        path = './scripts/data-transaction-anchor.js';
        params = {
            wavesConfig: wavesConfig,
            walletSeed: process.env.SOURCE_WALLET_SEED
        };
    break;
    case 'dataTransactionsList':
        path = './scripts/data-transactions-list.js';
        params = {
            // wavesConfig: wavesConfig
        };
    break;
}

if (!path) return console.error('module type is not specified correctly');

const func = require(path);

if (!params.walletSeed) { 
    const initParams = { wavesConfig };

    getNodeWalletSeed(initParams)
        .then(data => {
            params.walletSeed = data.walletSeed;
            params.senderAdress = data.senderAdress;
            func(params);
        }).catch(error => console.error(error))
} else {
    func(params);    
}
