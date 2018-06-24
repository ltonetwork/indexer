'use strict'

const util = require('util');
const request = require('request');
const crypto = require('crypto');//TEST
const redis = require('redis').createClient();
const WavesAPI = require('@waves/waves-api');
const defaultWavesConfig = WavesAPI.TESTNET_CONFIG;

const DATA_TRANSACTION_TYPE = 12;
const ANCHOR = '\u2693';

var Waves = null;

module.exports = function(params) {
    console.log('transaction params: ', params);  

    const wavesConfig = params.wavesConfig ? params.wavesConfig : defaultWavesConfig;
    Waves = WavesAPI.create(wavesConfig);

    getLastBlock()
        .then(lastBlock => processBlock(lastBlock))
        .then(lastBlock => processPrevBlock(lastBlock))
        .then(() => onDone())
        .catch(error => onError(error));
}

//Get last block of blockchain
function getLastBlock() {
    return new Promise((resolve, reject) => {
        Waves.API.Node.v1.blocks.last()
            .then(lastBlock => resolve(lastBlock))
            .catch(error => reject(error));
    });
}

//Process transactions from current block
function processBlock(block) {
    console.log('');
    console.log('process block: ', block);

    return new Promise((resolve, reject) => {        
        const transactions = block.transactions.slice();
        const resolveBlock = function() {
            resolve(block);
        };

        processNextTransaction(transactions, resolveBlock, reject);
    });
}

//Process prev block of given block
function processPrevBlock(block) {
    const ref = block.reference;

    return new Promise((resolve, reject) => {        
        Waves.API.Node.v1.blocks.get(ref)
            .then(block => processBlock(block))
            .then(block => processPrevBlock(block))
            .then(() => resolve())
            .catch(error => reject(error));
    });
}

//Launch processing of next transaction in block
function processNextTransaction(transactions, resolve, reject) {
    if (!transactions.length) {
        console.log('end processing block');
        return resolve();
    }

    const transaction = transactions.shift();
    const anchorData = getAnchorData(transaction);
    const transactionId = transaction.id;

    if (transaction) console.log('process transaction');

    save({ anchorData, transactionId })
        .then(() => processNextTransaction(transactions, resolve, reject))
        .catch(error => reject(error));
}

//Get transaction data for anchor key
function getAnchorData(transaction) {
    const skip = !transaction || 
        transaction.type !== DATA_TRANSACTION_TYPE || 
        typeof transaction.data === 'undefined';

    if (skip) return null;

    for (var i = 0; i < transaction.data.length; i++) {
        var item = transaction.data[i];
        if (item.key === ANCHOR) return item.value;
    }

    return null;
}

//Save info about transaction
function save(item) {
    return new Promise((resolve, reject) => {    
        var key = item.anchorData;
        const value = item.transactionId;

        if (!key) return resolve();
        key = key.replace('base64:', '');

        console.log('check if key exists: ', key);

        redis.get(key, (error, result) => {
            if (error) return reject('Error while getting item ' + key + ': ' + error);
            if (result !== null) return resolve();

            console.log('save data: ', value);

            redis.set(key, value, (error, result) => {
                error ? 
                    reject('Error while saving item ' + key + ': ' + error) :
                    resolve();                        
            });
        });
    });
}

//Perform some final actions after process is complete
function onDone() {
    console.log('All transactions processed');
    process.exit(0);
}

//Perform some actions if an error occured
function onError(error) {
    console.error('Error processing transactions list: ' + error);
    process.exit(0);
}
