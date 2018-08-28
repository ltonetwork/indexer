# Anchoring service

This is a small web app for saving and anchoring arbitrary data into the global blockchain.

## Application

It can be launched via standard `node src/index.js` command. It will run the anchor service, that will accept and process requests either through UI or using API calls. Server listens to port `3000` or change the port number through the `PORT` env variable.

Data, that can be anchored through UI, is either a text data, or a file.

Two operations are supported:

- verify, if text or file are already anchored
- perform anchoring

Through API these operations can be executed, using the following queries correspondingly:

- `GET /hash/{hash}` This will check for `hex` encoded hashses.
- `GET /hash/{hash}/encoding/{encoding}` With allow encoding types being: `base64`, `base58` and `hex`
- `POST /hash`

With the body contain the hash and optionally the encoding of the hash:
```$json
{ 
    hash: {hash},
    encoding: {hex} // Defaults to 'hex'
}
```

Both operations, in case if anchor exists/created, return a chainpoint, given in a format introduced by [Chainpoint](https://chainpoint.org/). Merkle tree is not used here for anchoring, so we ommit some chainpoint properties.

Example response:

    {
        "chainpoint": {
            "@context": "https://w3id.org/chainpoint/v2",
            "type": "ChainpointSHA256v2",
            "targetHash": "6b51d431df5d7f141cbececcf79edf3dd861c3b4069f0b11661a3eefacbba918",
            "anchors": [
                {
                    "type": "`LTODataTransaction",
                    "sourceId": "DHAZrbPYDcqYnHb79jo5D6xReyUDtCvYUvXsx9DhP9NB"
                }
            ]
        }
    }    

where:

- `targetHash` is a `sha256` data hash
- `anchors[0].sourceId` is a blockchain transactions id, where data is saved

If hash is not found in database on verification, the following response is returned:

    {
        "chainpoint": null
    }

In case if an error occured during processing, the object with a single `error` property is returned, that can be either a string or an object.

Example:

    {
        "error": "State check failed. Reason: negative waves balance: 3Mr6yz6hp7cDKBaNzKuMFU6Nh2UjfpdvtHa, old: 3, new: -99997"
    }

When using API and performing `save` operation call, it does not auto-perform `verify` operation, so you should perform it manually.

Verification is performed not on blockchain, but on anchors, uploaded from blockchain to database.

## Configuration

Node that handles requests to global blockchain, can be configured in file `/config/default.js`
