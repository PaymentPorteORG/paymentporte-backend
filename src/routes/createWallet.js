const express = require('express');
const app = express();
const router = express.Router();
const wallet = require('../controllers/wallet.js')

router.post('/createWallet',wallet.createWallet);

router.post('/importWallet', wallet.importWallet);

router.post('/decryptWallet', wallet.decryptWallet)

router.post('/fundWallet',wallet.fundWallet)  

router.get('/getBalance',wallet.getBalance)

module.exports = router;