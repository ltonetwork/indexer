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
const swaggerJSDoc = require('swagger-jsdoc');
const info = require('../package');


(async () => {
  const app = express();
  const port = config.port;

  app.use(nocache());
  app.use(bodyParser.json());

  app.use('/hash', setRoutes);
  app.use(setErrorHandler);

  // Swagger conf
  const options = {
    definition: {
      info: {
        title: info.name,
        version: info.version
      },
    },
    apis: ['./src/routes/*.js'], // Path to the API docs
  };

  // Initialize swagger-jsdoc -> returns validated swagger spec in json format
  const swaggerSpec = swaggerJSDoc(options);
  app.get('/swagger.json', (req, res) => {
    res.json(swaggerSpec);
  });

  app.use(express.static('./src/public'));

  app.listen(port, (err) => {
    if (err) {
      return logger.error('There was an error: ', err)
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