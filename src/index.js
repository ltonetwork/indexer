/**
 * App entry point, launch server
 */

const nocache = require('nocache');
const express = require('express');
const bodyParser = require('body-parser');
const setRoutes = require('./routes');
const setErrorHandler = require('./middleware/error-handler.js');
const config = require('config');
const AnchorProcessor = require('./utils/anchorprocessor');
const logger = require('./utils/logger');

(async () => {
  const app = express();
  const port = process.env.PORT || 3000;

  app.use(nocache());
  app.use(bodyParser.json());
  app.use(express.static('./src/public'));

  app.use('/hash', setRoutes);
  app.use(setErrorHandler);

  app.listen(port, (err) => {
    if (err) {
      return console.log('There was an error: ', err)
    }

    logger.info(`server is listening on ${port}`)
  });


  const anchorProcessor = new AnchorProcessor(config);

  try {
    await anchorProcessor.checkNewBlock();
    anchorProcessor.startMonitor();
  } catch (e) {
    logger.warn('Failed to preload all the anchors');
    anchorProcessor.startMonitor();
  }

// Initiate the block until where the db is filled
  process.on('exit', () => {
    console.log('Exiting');
    anchorProcessor.stopMonitor();
    anchorProcessor.closeDB();
  });
})();