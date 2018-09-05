module.exports = {
  apiSecret: process.env.LTO_API_KEY || 'lt1secretapikey!',
  dbUrl: 'redis://redis',
  nodeAddress: 'http://public-node:6869',
  startingBlock: 1,
  port: process.env.PORT || 80
};
