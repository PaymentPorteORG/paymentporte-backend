const stellarSdk = require('stellar-sdk');
const config = require('config');

stellarSdk.Network.useTestNetwork();

module.exports = new stellarSdk.Server(config.get('development.providers.testnet'))

