![LTO github readme](https://user-images.githubusercontent.com/100821/196711741-96cd4ba5-932a-4e95-b420-42d4d61c21fd.png)

# Indexer

[![Build Status](https://travis-ci.com/ltonetwork/indexer.svg?branch=master)](https://travis-ci.com/ltonetwork/indexer)

Index and query data from the LTO Network public chain.

## Application

It can be launched via `yarn start`. It will run the index service, that will accept and process requests either through UI or using API calls. The server listens to port `3000` by default. You can change the port number through the `PORT` env variable.

Explore all API endpoints using the Swagger interface.

## Docker

A `Dockerfile` is available on the root for making it easy to deploy as a Docker container.

There are Docker compose setups available for different node types in the [`LTO Node`](https://github.com/ltonetwork/lto-node) repository.

You can use the environment variables on the `indexer` to enable/disable features or use Redis instead of LevelDB. See more on **Configuration** below.

# URL Endpoints

## Anchoring

Data, that can be anchored through UI, is either text, data, or a file.

Two operations are supported:

- verify, if text or file are already anchored
- perform anchoring

Through API these operations can be executed, using the following queries correspondingly:

- `GET /hash/:hash` This will check for `hex` encoded hashes.
- `GET /hash/:hash/encoding/:encoding` With allow encoding types being: `base64`, `base58` and `hex`
- `POST /hash`

With the body containing the hash and optionally the encoding of the hash:

```$json
{
    "hash": {hash},
    "encoding": {hex} // Defaults to 'hex'
}
```

Both operations, in case the anchor exists or is created, return a [Chainpoint respresentation](https://chainpoint.org/). Merkle tree is not used here for anchoring, so we omit some Chainpoint properties.

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

If the hash is not found in the database on verification, the following response is returned:

```json
{
  "chainpoint": null
}
```

## Associations

It's possible to index and query associations.

- `GET /associations/:address`

```json
{
  "children": ["did:lto:3Jmh1EcLL2GieVAYeyF42D4cBxjAFVUJMpR", "did:lto:3JsYP8QYvkiC5x2nPzUkVYEfQVwXnogXaGP"],
  "parents": ["did:lto:3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL"]
}
```

_TODO: query associations as DID URLs_

## DID documents

By default, the service will index the public keys of all addresses that have done a transaction on LTO Network. These addresses are available
as [DID document](https://www.w3.org/TR/did-core/).

- `GET /identifiers/:did`

The `did` parameter is either the LTO Network DID (eg `lto:did:3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL`) or just the wallet address
(eg `3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL`).

```json
{
  "@context": "https://www.w3.org/ns/did/v1",
  "id": "did:lto:3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL",
  "verificationMethod": [
    {
      "id": "did:lto:3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL#sign",
      "type": "Ed25519VerificationKey2018",
      "controller": "did:lto:3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL",
      "publicKeyBase58": "AVXUh6yvPG8XYqjbUgvKeEJQDQM7DggboFjtGKS8ETRG"
    }
  ],
  "authentication": ["did:lto:3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL#sign"],
  "assertionMethod": ["did:lto:3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL#sign"]
}
```

The endpoint is compliant with [DID Resolution v0.3](https://w3c-ccg.github.io/did-resolution/). You may send the header

    Accept: application/ld+json;profile="https://w3id.org/did-resolution"

to get a DID Resolution response

```json
{
  "@context": "https://w3id.org/did-resolution/v1",
  "didDocument": {
    ...
  },
  "didDocumentMetadata": {
    "created": "2023-08-22T12:00:00Z",
    "deactivated": false,
  },
  didResolutionMetadata: {
    ...
  }
}
```

## Transactions

The public node will only store the latest transactions of each account. Use the indexer to store all transactions.

- `GET /transactions/addresses/:address`

The response is an array of transactions.

## Statistics

The indexer will keep track of multiple statistics if set on the configuration:

```json
{
  "stats": {
    "operations": true,
    "transactions": true,
    "supply": true
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

In case an error occurred during processing, the object with a single `error` property is returned, which can be either a string or an object.

Example:

```json
{
  "error": "State check failed. Reason: negative balance: 3Mr6yz6hp7cDKBaNzKuMFU6Nh2UjfpdvtHa, old: 3, new: -99997"
}
```

When using API and performing `save` operation call, it does not auto-perform `verify` operation, so you should perform it manually.

# Configuration

You can run container with predefined environment variables:

| variable name                 | description                                              | format                                  | default value                               | extra information                                                                                                                                                             |
|-------------------------------|----------------------------------------------------------|-----------------------------------------|---------------------------------------------| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                    | The application environment                              | `production`, `development`, `test`     | `"development"`                             |                                                                                                                                                                               |
| `PORT`                        | The port the application runs on                         | number                                  | `80`                                        |                                                                                                                                                                               |
| `API_PREFIX`                  | Path prefix for the API                                  | string                                  |                                             |                                                                                                                                                                               |
| `TRUST_NETWORK_INDEXING`      | Indexing of role associations of the trust network       | boolean                                 | `false`                                     |                                                                                                                                                                               |
| `TRUST_NETWORK_ROLES`         | Configuration for roles on trust network                 | object                                  | `"root": {"description": "The root role" }` |                                                                                                                                                                               |
| `ASSOCIATION_INDEXING`        | Indexing of association transactions                     | `none`, `trust`, `all`                  | `"none"`                                    |                                                                                                                                                                               |
| `ASSOCIATION_USE_GRAPH`       | Whether to use Redis Graph to store associations         | boolean                                 | `false`                                     | Requires `redis_graph` to be set                                                                                                                                              |
| `DID_INDEXING`                | Indexing of DIDs (decentralized identifiers)             | boolean                                 | `false`                                     | Tracks verification methods and public keys for addresses                                                                                                                     |
| `TRANSACTION_INDEXING`        | Indexing of transactions                                 | boolean                                 | `false`                                     |                                                                                                                                                                               |
| `ANCHOR_INDEXING`             | Indexing of anchor transactions                          | `none`, `trust`, `all`                  | `"none"`                                    |                                                                                                                                                                               |
| `STATS_INDEXING`              | Indexing of blockchain statistics                        | boolean                                 | `false`                                     | Enables `operations`, `transactions` and `supply` stats                                                                                                                       |
| `FEES_ANCHOR`                 | Fees for anchor transactions                             | number                                  | `35000000`                                  | Should have 8 digits (`value * 10 ^ 8`). [About fees](https://docs.ltonetwork.com/protocol/public/transactions#transaction-fees)                                              |
| `FEES_SPONSOR`                | Fees for sponsor transactions                            | number                                  | `500000000`                                 | Should have 8 digits (`value * 10 ^ 8`). [About fees](https://docs.ltonetwork.com/protocol/public/transactions#transaction-fees)                                              |
| `REDIS_URL`                   | Redis database connection string                         | string                                  | `"redis://localhost"`                       |                                                                                                                                                                               |
| `REDIS_CLUSTER`               | Redis cluster connection string                          | string                                  | `""`                                        |                                                                                                                                                                               |
| `LEVELDB_NAME`                | LevelDB database name                                    | string                                  | `"lto-index"`                               |                                                                                                                                                                               |
| `NODE_URL`                    | Node URL                                                 | string                                  | `"http://localhost:6869"`                   |                                                                                                                                                                               |
| `NODE_API_KEY`                | Node API key                                             | string                                  | `"lt1secretapikey!"`                        |                                                                                                                                                                               |
| `STARTING_BLOCK`              | Block number to start processing from                    | number                                  | `1`                                         |                                                                                                                                                                               |
| `RESTART_SYNC`                | Whether or not to restart processing from starting block | boolean                                 | `false`                                     | If this is enabled, the indexer will process ALL blocks again, from starting block. It WILL take some time to process. Use with caution.                                      |
| `AUTH_TOKEN`                  | Authentication token                                     | string                                  | `""`                                        |                                                                                                                                                                               |
| `MONITOR_INTERVAL`            | Monitor interval                                         | number                                  | `5000`                                      | Value in miliseconds                                                                                                                                                          |
| `LOG_LEVEL`                   | Log level for the application                            | `off`, `error`, `warn`, `info`, `debug` | `info`                                      |                                                                                                                                                                               |
| `STORAGE_TYPE`                | Storage type                                             | `redis`, `leveldb`                      | `leveldb`                                   | If `redis`, requires `redis_url` or `redis_cluster` to be set                                                                                                                 |

The indexing configurations have the values of `none`, `trust`, or `all`.

- `none`: no transactions will be indexed
- `trust`: only transactions from someone in your configured trust network will be indexed (see [configuring a trust network](https://docs.ltonetwork.com/v/edge/node/identity-node/configuration-1/configuration))
- `all`: all transactions will be indexed

_Note_: Keep in mind that if you change a configuration after the indexer has already processed blocks, you will need to restart the synchronization, basically making
the indexer process blocks all over again. This WILL take some time to complete, as it needs to process all of the blocks again. Be sure to set `restart_sync` to `false` after you're done.

```json
{
  "starting_block": 1,
  "restart_sync": true
}
```

## Changing values on the config file

An alternative to changing the configuration is by using a config file in `src/config/`.

_Do not mistake this file with `default.SCHEMA.json`. The `schema` file contains only information on what variables are available, and what are their possible values. This should NOT be changed._

Create a file `default.config.json`. You can set any variable you'd like as a JSON structure. If you'd like to enable the indexing of anchor transactions for example:

```json
{
  "anchor": {
    "indexing": "all"
  }
}
```

Any changes made to the config file or the environment variables will require a restart of the application in order to take effect.

Enabling indexing will take effect from the last process block, so it might be necessary 
