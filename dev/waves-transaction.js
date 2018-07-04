'use strict'

const util = require('util');
const WavesAPI = require('@waves/waves-api');

var Waves = null;

module.exports = function(params) {
    console.log('transaction params: ', params);

    Waves = WavesAPI.create(params.wavesConfig);
    const seed = Waves.Seed.fromExistingPhrase(params.walletSeed);

    return issueTransaction(params, seed)
        .then(response => transferTransaction(response, params, seed));
}

//Create transaction
function issueTransaction(params, seed) {
    return new Promise((resolve, reject) => {
        const issueData = {
            name: params.tokenName,
            description: params.tokenDesc,            
            quantity: params.tokenQuantity,
            precision: 5,
            reissuable: false,
            fee: 100000000,
            timestamp: Date.now()
        };

        Waves.API.Node.v1.assets.issue(issueData, seed.keyPair).then((response) => {
            console.log('issue response: ', util.inspect(response, {depth: 5}));
            resolve(response);
        }).catch(error => reject(error));
    })
}

//Execute transaction
function transferTransaction(issueResponse, params, seed) {
    return new Promise((resolve, reject) => {
        const transferData = {
            recipient: params.recipient,
            assetId: 'WAVES',        
            amount: params.wavesAmount,
            feeAssetId: 'WAVES',
            fee: 100000,
            attachment: '',
            timestamp: Date.now()
        };

        Waves.API.Node.v1.assets.transfer(transferData, seed.keyPair).then((response) => {
            console.log('transfer response: ', util.inspect(response, {depth: 5}));
            resolve(response);
        }).catch(error => reject(error));
    });
}
