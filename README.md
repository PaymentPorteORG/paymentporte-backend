# Payment Porte Project

It provides APIs for handling below tasks:

* Fetching and formatting data from the Stellar network
* Transferring stellar lumens and PORTE tokens to and from the Stellar network

## Getting Started
To get the Node server running locally:

* Clone this repo
* `npm install` to install all required dependencies
* Install MongoDB Community Edition (instructions) and run it by executing `mongod`
* `npm start` to start the server

## Code Overview

### Dependencies

* [expressjs](https://expressjs.com) - The server for handling and routing HTTP requests
* [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) - For generating JWTs used by authentication
* [mongoose](https://mongoosejs.com) - For modeling and mapping MongoDB data to javascript
* [stellar-hd-wallet](https://www.npmjs.com/package/stellar-hd-wallet) - For Stellar wallet key derivation 
* [stellar-sdk](https://stellar.github.io/js-stellar-sdk/) - A Javascript library for communicating with a Stellar Horizon server

## Application Structure
* `server.js` - The entry point to our application. This file defines our express server and connects it to MongoDB using mongoose. It also requires the routes and models we'll be using in the application.
* `src/routes/` - This folder contains the route definitions for our API.
* `src/models/` - This folder contains the schema definitions for our Mongoose models.
* `src/controllers/` - This folder contains the controller methods like user-onboarding & create/import wallet.

## Error Handling
In `src/middleware/handlers.js`, we define a error-handling middleware for handling Mongoose's ValidationError. This middleware will respond with a different status code and format the response to have error messages the clients can understand

## Authentication
Requests are authenticated using the Authorization header with a valid JWT. We define two express middlewares in `src/middleware/authorization.js` that can be used to authenticate requests. The required middleware configures the express-jwt middleware using our application's secret and will return a specific status code if the request cannot be authenticated. The payload of the JWT can then be accessed from req.payload in the endpoint.

Created at Appinventiv