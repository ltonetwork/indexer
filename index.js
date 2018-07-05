/**
 * App entry point, launch server
 */

const nocache = require('nocache');
const express = require('express');
const bodyParser = require('body-parser');
const setRoutes = require('./scripts/routes');
const setErrorHandler = require('./scripts/error-handler.js');

const app = express();
const port = 80;

app.use(nocache());
app.use(bodyParser.json());
app.use(express.static('public'));

setRoutes(app);
setErrorHandler(app);

app.listen(port, (err) => {
    if (err) {
        return console.log('There was an error: ', err)
    }

    console.log(`server is listening on ${port}`)
});
