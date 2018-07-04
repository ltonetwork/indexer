'use strict'

const config = require('./scripts/config.js')();
const getNodeWalletSeed = require('./scripts/node-wallet-data.js');
const dataTransactionsList = require('../scripts/data-transactions-list.js');

getNodeWalletSeed(config)
    .then(data => {
        config.walletSeed = data.walletSeed;
        config.senderAdress = data.senderAdress;

        return dataTransactionsList(config);
    })
    .then(response => onDone(response))
    .catch(error => onError(error));

//Perform some final actions after transaction is completed
function onDone(transferResponse) {
    console.log('All transactions processed');
    process.exit(0);
}

//Perform some actions if an error occured
function onError(error) {
    console.error('Error processing transactions list: ' + error);
    process.exit(0);
}
