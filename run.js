'use strict'

const func = require('./index.js');
const params = {
    walletSeed: process.env.SOURCE_WALLET_SEED,
    recipient: process.env.RECIPIENT_WALLET_ADRESS,
    tokenName: process.env.TOKEN_NAME,
    tokenDesc: process.env.TOKEN_DESC,
    tokenQuantity: process.env.TOKEN_QUANTITY,
    wavesAmount: process.env.TRANSACTION_WAVES_AMOUNT
};

func(params);