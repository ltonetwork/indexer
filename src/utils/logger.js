const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  level: (process.env.LOGLEVEL ? process.env.LOGLEVEL.toLowerCase() : 'info'),
  format: format.combine(
    format.timestamp(),
    format.printf(i => `${i.timestamp} | ${i.level} | ${i.message}`)
  ),
  json: false,
  transports: [
    new transports.Console(),
  ]
});

module.exports = logger;