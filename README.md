# Itentity service

This is a web service that to retrieve DID documents for LTO Network addresses.

## Application

It can be launched via standard `node src/index.js` command. It will run the identity service, that will accept and process requests either through UI or using API calls. Server listens to port `3000` or change the port number through the `PORT` env variable.

## Configuration


**You can run container with predefined environment variables:**

|env variable   |description|
|---------------|-----------|
|`LTO_API_KEY`  | ApiKey used in communication with the public node |
|`LOG_LEVEL`    | Node logging level, available values: `OFF`, `ERROR`, `WARN`, `INFO`, `DEBUG` |
|`PORT`         | Port number the service should use |


Node that handles requests to global blockchain, can be configured in file `/config/default.js`
