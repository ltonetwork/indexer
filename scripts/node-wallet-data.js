'use strict'

const util = require('util');
const request = require('request');
const WavesAPI = require('@waves/waves-api');
const defaultWavesConfig = WavesAPI.TESTNET_CONFIG;

var Waves = null;

module.exports = function(params) {
    console.log('fetching node\'s wallet info');
    console.log('params: ', params);

    const wavesConfig = params.wavesConfig ? params.wavesConfig : defaultWavesConfig;
    Waves = WavesAPI.create(wavesConfig);

    return getNodeWalletSeed()
        .then(seed => getNodeWalletAddress(seed));
}

function getNodeWalletSeed() {
    return new Promise((resolve, reject) => {
        console.log('request to get node wallet seed');

        request({
            headers: {
                'X-Api-Key': 'ridethewaves!',
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            uri: ' http://localhost:6869/wallet/seed',
            method: 'GET'
        }, (error, responseObj, response) => {
            response = JSON.parse(response);
            console.log('response: ', response);

            if (error) return reject(error);
            if (!response || !response.seed) return reject('No seed for node\'s wallet found');

            resolve(response.seed);
        });
    });
}

function getNodeWalletAddress(seed) {
    return new Promise((resolve, reject) => {
        console.log('request to get list of node\'s adresses');

        request({
            headers: {
                'X-Api-Key': 'ridethewaves!',
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            uri: ' http://localhost:6869/addresses',
            method: 'GET'
        }, (error, responseObj, response) => {
            response = JSON.parse(response);
            console.log('response: ', response);

            if (error) return reject(error);
            if (!response.length) return reject('No adresses in node\'s wallet');

            const data = {walletSeed: seed, senderAdress: response[0]};

            resolve(data);
        });
    });
}
