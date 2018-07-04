'use strict'

const util = require('util');
const request = require('request');
const WavesAPI = require('@waves/waves-api');

var Waves = null;

module.exports = function(params) {
    console.log('fetching node\'s wallet info');
    console.log('params: ', params);

    Waves = WavesAPI.create(params.wavesConfig);

    return getNodeWalletSeed(params)
        .then(seed => getNodeWalletAddress(params, seed));
}

function getNodeWalletSeed(params) {
    return new Promise((resolve, reject) => {
        console.log('request to get node wallet seed');

        const nodeUrl = params.wavesConfig.nodeAddress;

        request({
            headers: {
                'X-Api-Key': 'ridethewaves!',
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            uri: nodeUrl + '/wallet/seed',
            method: 'GET',
            json: true
        }, (error, responseObj, response) => {
            console.log('response: ', response);

            if (error) return reject(error);
            if (!response || !response.seed) return reject('No seed for node\'s wallet found');

            resolve(response.seed);
        });
    });
}

function getNodeWalletAddress(params, seed) {
    return new Promise((resolve, reject) => {
        console.log('request to get list of node\'s adresses');

        const nodeUrl = params.wavesConfig.nodeAddress;

        request({
            headers: {
                'X-Api-Key': 'ridethewaves!',
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            uri: nodeUrl + '/addresses',
            method: 'GET',
            json: true
        }, (error, responseObj, response) => {
            console.log('response: ', response);

            if (error) return reject(error);
            if (!response.length) return reject('No adresses in node\'s wallet');

            const data = {walletSeed: seed, senderAdress: response[0]};

            resolve(data);
        });
    });
}
