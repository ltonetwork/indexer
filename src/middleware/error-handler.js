const logger = require('../utils/logger');
/**
 * Set app routes
 */

module.exports = (error, request, response, next) => {
  logger.error(error);
  response.status(500).json({error});
};
