'use strict'

const getNodeWalletSeed = require('../scripts/node-wallet-data.js');
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
        path = './waves-transaction.js';
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
        path = './data-transaction.js';
        params = {
            wavesConfig: wavesConfig,
            walletSeed: process.env.SOURCE_WALLET_SEED
        };
    break;
    case 'dataTransactionAnchor':        
        const sha256Data = crypto.createHmac('sha256', 'Some secret');
        sha256Data.update('Some binary data');
        const sha256Hash = sha256Data.digest('hex');
        const base64Hash = Buffer.from(sha256Hash).toString('base64');

        path = '../scripts/data-transaction-anchor.js';
        params = {
            dataHash: base64Hash,
            wavesConfig: wavesConfig,
            walletSeed: process.env.SOURCE_WALLET_SEED
        };
    break;
    case 'dataTransactionsList':
        path = '../scripts/data-transactions-list.js';
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
            return func(params);
        })
        .then(response => onDone(response))
        .catch(error => onError(error));
} else {
    func(params);    
}

//Perform some final actions after transaction is completed
function onDone(transferResponse) {
    console.log(transferResponse);
}

//Perform some actions if an error occured
function onError(error) {
    console.error('Error while performing transaction: ' + error);
}
