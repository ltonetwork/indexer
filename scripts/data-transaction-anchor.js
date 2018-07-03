'use strict'

const util = require('util');
const request = require('request');
const crypto = require('crypto');
const WavesAPI = require('@waves/waves-api');

var Waves = null;

module.exports = function(params) {
    console.log('transaction params: ', params);    

    Waves = WavesAPI.create(params.wavesConfig);
    const seed = Waves.Seed.fromExistingPhrase(params.walletSeed);

    return createTransactionData(params, seed)
        .then(data => transferTransaction(data, params));        
}

//Create transaction data
function createTransactionData(params, seed) {
    return new Promise((resolve, reject) => {        
        const data = {
            version: 1,
            type: 12,
            sender: params.senderAdress,          
            senderPublicKey: seed.keyPair.publicKey,  
            data: [
                {key: '\u2693', type: 'binary', value: 'base64:' + params.dataHash}
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

        const nodeUrl = params.wavesConfig.nodeAddress;

        request({
            headers: {
                'X-Api-Key': 'ridethewaves!',
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            uri: nodeUrl + '/addresses/data',
            body: data,
            method: 'POST',
            json:true
        }, (error, responseObj, response) => {
            console.log('response: ', response);

            if (error) return reject(error);
            if (response.error) {
                const message = response.message ? response.message : response.error;
                return reject(message);
            }

            resolve(response.tx);
        });
    });
}
