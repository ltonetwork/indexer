'use strict'

const util = require('util');
const request = require('request');
const crypto = require('crypto');
const WavesAPI = require('@waves/waves-api');
const defaultWavesConfig = WavesAPI.TESTNET_CONFIG;

var Waves = null;

module.exports = function(params) {
    console.log('transaction params: ', params);    

    const wavesConfig = params.wavesConfig ? params.wavesConfig : defaultWavesConfig;
    Waves = WavesAPI.create(wavesConfig);

    const seed = Waves.Seed.fromExistingPhrase(params.walletSeed);

    createTransactionData(params, seed)
        .then(data => transferTransaction(data, params))
        .then(response => onDone(response))
        .catch(error => onError(error));
}

//Create transaction data
function createTransactionData(params, seed) {
    return new Promise((resolve, reject) => {
        const sha256Data = crypto.createHmac('sha256', 'Some secret');
        sha256Data.update('Some binary data');
        const sha256Hash = sha256Data.digest('hex');
        const base64Hash = Buffer.from(sha256Hash).toString('base64');

        const data = {
            version: 1,
            type: 12,
            sender: seed.address,          
            senderPublicKey: seed.keyPair.publicKey,  
            data: [
                {key: '\u2693', type: 'binary', value: 'base64:' + base64Hash}
            ],
            fee: 100000,
            timestamp: Date.now()
        };

        resolve(data);
    })
}

//Execute transaction
function transferTransaction(data, params) {
    return new Promise((resolve, reject) => {
        console.log('send data: ', data);

        request({
            headers: {
                'X-Api-Key': 'ridethewaves!',
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            uri: ' http://localhost:6869/addresses/data',
            body: JSON.stringify(data),
            method: 'POST'
        }, (error, responseCode, response) => {
            console.log('responseCode: ', responseCode);
            console.log('response: ', response);
            error ? reject(error) : resolve(response);
        });
    });
}

//Perform some final actions after transaction is completed
function onDone(transferResponse) {
    console.log(transferResponse);
}

//Perform some actions if an error occured
function onError(error) {
    console.error('Error while performing transaction: ' + error);
}
