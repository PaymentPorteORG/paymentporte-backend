const express = require('express');
const app = express();
const router = express.Router();
const stellarSdk = require('stellar-sdk');
const stellarHdWallet = require('stellar-hd-wallet');
const logger = require('../utils/logger');
const config = require('config');

stellarSdk.Network.useTestNetwork();
var horizon = new stellarSdk.Server(config.get('development.providers.testnet'));


module.exports = router;