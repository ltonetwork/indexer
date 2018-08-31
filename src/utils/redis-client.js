const Redis = require('ioredis');
const config = require('config');
const url = process.env.ANCHOR_DB_URL || config.dbUrl;
const clusterUrl = process.env.ANCHOR_DB_CLUSTER_URL || false;

module.exports = clusterUrl ? new Redis.Cluster(clusterUrl) : new Redis(url);

