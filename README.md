# Waves Anchor

This is a small web app for saving and anchoring arbitrary data into Waves blockchain.

It basicaly consists of two parts:

- web-app, for anchoring data and veryfing, if it's anchored
- a script, that runs in the background and pulls out all anchored data to the database

## Web Application

It can be launched via standard `node index.js` command. It will run `node.js` server, that will accept and process requests either through UI or using API calls. Server listens to port `80`.

Data, that can be anchored through UI, is either a text data, or a file.

Two operations are supported:

- verify, if text or file are already anchored
- perform anchoring

Through API these operations can be executed, using the following queries correspondingly:

- `GET /{hash}`
- `POST /{hash}`

where `{hash}` is a `sha256` hash of data.

Both operations, in case if anchor exists/created, return a chainpoint, given in a format introduced by [Chainpoint](https://chainpoint.org/). Merkle tree is not used here for anchoring, so we ommit some chainpoint properties.

Verification is performed not on blockchain, but on anchors, uploaded from blockchain to database by a script.

Example response:

    {
        "chainpoint": {
            "@context": "https://w3id.org/chainpoint/v2",
            "type": "ChainpointSHA256v2",
            "targetHash": "6b51d431df5d7f141cbececcf79edf3dd861c3b4069f0b11661a3eefacbba918",
            "anchors": [
                {
                    "type": "WAVESDataTransaction",
                    "sourceId": "DHAZrbPYDcqYnHb79jo5D6xReyUDtCvYUvXsx9DhP9NB"
                }
            ]
        }
    }    

where:

- `targetHash` is a `sha256` data hash
- `anchors[0].sourceId` is a Waves blockchain transactions id, where data is saved

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

## Script for fetching anchors list

It can be launched with the `node job.js` command. It looks through all Waves blockchain transactions, starting from the latest one, and maps all the anchored data to Redis database (so Redis instance should be prepared first).
Data is stored in the form `{data hash} -> {waves transaction id}`.

## Configuration

Waves node, that handles requests to blockchain, can be configured in file `/scripts/config.js`
