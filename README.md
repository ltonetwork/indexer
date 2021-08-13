![github-banner](https://user-images.githubusercontent.com/100821/108692834-6a115200-74fd-11eb-92df-ee07bf62b386.png)

# Indexer
[![Build Status](https://travis-ci.com/ltonetwork/indexer.svg?branch=master)](https://travis-ci.com/ltonetwork/indexer)

Index and query data from the LTO Network public chain.

## Application

It can be launched via `nmp start`. It will run the index service, that will accept and process requests either through UI or using API calls. Server listens to port `80` or change the port number through the `PORT` env variable.

Expolore all API endpoint using the swagger interface.

## Docker

A `Dockerfile` is available on the root, along with a `docker-compose.yml` for making it easy to deploy as a Docker container. 

The `docker-compose` file also creates a `redis` and `redis-graph` container, and enables the `indexer` to work with a Redis database.

You can use the environment variables on the `indexer` to enable/disable features or use LevelDB (default) instead of Redis. See more on **Configuration** below.

## Anchoring

Data, that can be anchored through UI, is either a text data, or a file.

Two operations are supported:

- verify, if text or file are already anchored
- perform anchoring

Through API these operations can be executed, using the following queries correspondingly:

- `GET /hash/:hash` This will check for `hex` encoded hashses.
- `GET /hash/:hash/encoding/:encoding` With allow encoding types being: `base64`, `base58` and `hex`
- `POST /hash`

With the body contain the hash and optionally the encoding of the hash:
```$json
{ 
    "hash": {hash},
    "encoding": {hex} // Defaults to 'hex'
}
```

Both operations, in case if anchor exists/created, return a chainpoint, given in a format introduced by [Chainpoint](https://chainpoint.org/). Merkle tree is not used here for anchoring, so we ommit some chainpoint properties.

Example response:

```json
{
    "chainpoint": {
        "@context": "https://w3id.org/chainpoint/v2",
        "type": "ChainpointSHA256v2",
        "targetHash": "6b51d431df5d7f141cbececcf79edf3dd861c3b4069f0b11661a3eefacbba918",
        "anchors": [
            {
                "type": "LTOAnchorTransaction",
                "sourceId": "DHAZrbPYDcqYnHb79jo5D6xReyUDtCvYUvXsx9DhP9NB"
            }
        ]
    }
}
```

where:

- `targetHash` is a `sha256` data hash
- `anchors[0].sourceId` is a blockchain transactions id, where data is saved

If hash is not found in database on verification, the following response is returned:

```json
{
  "chainpoint": null
}
```

## Associations

It's possibible to index and query associations.

- `GET /associations/:address`

```json
{
  "children": [
    "did:lto:3Jmh1EcLL2GieVAYeyF42D4cBxjAFVUJMpR",
    "did:lto:3JsYP8QYvkiC5x2nPzUkVYEfQVwXnogXaGP"
  ],
  "parents": [
    "did:lto:3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL"
  ]
}
```

_TODO: query associations as DID URLs_

## DID documents

By default the service will index the public keys of all addresses that have done a transaction on LTO Network. These addresses are available
as [DID document](https://www.w3.org/TR/did-core/).

- `GET /did/:url` 

The `url` parameter is either the LTO Network DID url (eg `lto:did:3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL`) or just the wallet address
(eg `3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL`).

The response is a DID document with an `authentication` section.
```json
{
  "@context": "https://www.w3.org/ns/did/v1",
  "id": "did:lto:3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL",
  "verificationMethod": [
    {
      "id": "did:lto:3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL#key",
      "type": "Ed25519VerificationKey2018",
      "controller": "did:lto:3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL",
      "publicKeyBase58": "AVXUh6yvPG8XYqjbUgvKeEJQDQM7DggboFjtGKS8ETRG"
    }
  ],
  "authentication": [
    "did:lto:3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL#key"
  ],
  "assertionMethod": [
    "did:lto:3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL#key"
  ]
}
```

## Transactions

The public node will only store the latest transactions of each account. Use the indexer to store all transactions.

- `GET /transactions/addresses/:address`

The response is an array of transactions.

## Statistics

The indexer will keep track of multiple statistics, if set on the configuration:


```json
{
  "stats": {
    "operations": true,
    "transactions": true,
    "supply": true,
  }
}
```

### Operations Statistics

Will keep track of the total number of operations. 

One transaction = one operation, unless one of the following:

- Anchors:
  - In the case of an anchor, each anchor hash will count as an operation
- Mass transfers:
  - In the case of mass transfers, each transfer will count as an operation

- `GET /stats/operations/`

The response is the amount of operations.

```json
{
  "operations": "12345"
}
```

### Supply Statistics

Will keep track of the token supply in the chain, including the transaction fee burned per transaction.

- `GET /stats/supply/circulating`

The response is the current circulating token supply

```json
{
  "circulatingSupply": "21466013.57000000"
}
```

- `GET /stats/supply/max`

The response is the current max token supply

```json
{
  "maxSupply": "50000000.00000000"
}
```

### Transaction statistics

Will keep track of the total number of transactions per day for each transaction type.

The `from` and `to` parameters are either a timestamp (in ms since epoch) or a date string as `year-month-day`.

- `GET /transactions/stats/:type/:from/:to`

The response is an aray of days with a transaction count for each.

```json
[
  { "period": "2021-03-01 00:00:00", "count": 56847 },
  { "period": "2021-03-02 00:00:00", "count": 103698 },
  { "period": "2021-03-03 00:00:00", "count": 33329 }
]
```

## Errors

In case if an error occured during processing, the object with a single `error` property is returned, that can be either a string or an object.

Example:
```json
{
  "error": "State check failed. Reason: negative balance: 3Mr6yz6hp7cDKBaNzKuMFU6Nh2UjfpdvtHa, old: 3, new: -99997"
}
```

When using API and performing `save` operation call, it does not auto-perform `verify` operation, so you should perform it manually.

Verification is performed not on blockchain, but on anchors, uploaded from blockchain to database.

## Configuration


**You can run container with predefined environment variables:**

|env variable     |description                                        |values                                   |
|-----------------|---------------------------------------------------|-----------------------------------------|
|`LTO_API_KEY`    | ApiKey used in communication with the public node | `some_api_string`                       |
|`LOG_LEVEL`      | Node logging level                                | `OFF`, `ERROR`, `WARN`, `INFO`, `DEBUG` |
|`PORT`           | Port number the service should use                | `80`                                    |
|`LTO_NODE_URL`   | URL of the LTO public node                        | `https://testnet.lto.network`           |
|`ANCHOR_INDEXING`| Whether or not the indexer should process anchors | `none`, `trust`, `all`                  |

A list of all available variables can be found on (./src/config/data/default.schema.json)[./src/config/data/default.schema.json] (see the `env` property of each variable).

### Changing values on the config file

An option to change the configuration is by changing the config file, found in (./src/config/data/default.config.json)[./src/config/data/default.config.json].

*Do not mistake this file with `default.SCHEMA.json`. The `schema` file contains only information on what variables are available, and what are their possible values. This should NOT be changed.*

By default, `default.config.json` should be empty. You can set any variable you'd like as a JSON structure. If you'd like to enable the indexing of anchor transactions for example:

```json
{
  "anchor": {
    "indexing": "all"
  }
}
```

The indexing configurations have the values of `none`, `trust` or `all`.

- `none`: no transactions will be indexed
- `trust`: only transactions from someone in your configured trust network will be indexed (see [configuring a trust network](https://docs.ltonetwork.com/v/edge/identity-node/configuration-1/configuration))
- `all`: all transactions will be indexed

*Note*: Keep in mind that if you change a configuration after the indexer has already processed blocks, you will need to restart the synchronization, basically making
the indexer process blocks all over again. This WILL take some time to complete, if you choose to start from the genesis block.

```json
{
  "anchor": {
    "node": {
      "starting_block": 1,
      "restart_sync": true
    }
  }
}
```

