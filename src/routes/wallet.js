const express = require('express');
const app = express();
const router = express.Router();
const wallet = require('../controllers/wallet');
const operations = require('../controllers/operations');
const { celebrate } = require('celebrate');
const WalletSchema = require('../validations/wallet.validations')
const auth = require('./../middleware/authorization');

/** creates a new wallet for the user */
router.post('/createWallet', auth.basicAuth, auth.userAuth,
    celebrate(WalletSchema.createWallet),
    wallet.createWallet
);

/** imports the user wallet */
router.post('/importWallet',auth.basicAuth, auth.userAuth,
    celebrate(WalletSchema.importWallet),
    wallet.importWallet
);

/** decrypt the user wallet data */
router.post('/decryptWallet',auth.basicAuth,auth.userAuth,
    celebrate(WalletSchema.decryptWallet),
    wallet.decryptWallet
);

/** provides loan to new users */
router.post('/fundWallet',auth.basicAuth, auth.userAuth,
    wallet.fundWallet
);

/** gets the balance of user wallet */
router.get('/getBalance',auth.basicAuth, auth.userAuth,
    celebrate(WalletSchema.getBalance),
    wallet.getBalance
);

/** merge user's account with funding account to recover loan funds */
router.post('/deleteAccount',auth.basicAuth,
    operations.deleteAccount
);

/** returns the wallet balance and transaction history */
router.get('/dashboard',auth.basicAuth,
    celebrate(WalletSchema.dashboard),
    wallet.dashboard
);

/** creates a trustline with PORTE token */
router.post('/createTrustline',auth.basicAuth,auth.userAuth,
    celebrate(WalletSchema.createTrustline),
    operations.createTrustline
);

/** sends the PORTE/XLM to others*/
router.post('/send',auth.basicAuth,auth.userAuth,
    celebrate(WalletSchema.send),
    wallet.send
);

/** pays off the loan provided on wallet creation */
router.post('/payCredits',auth.basicAuth, auth.userAuth,
    wallet.payCredits
);

/** creates trustline for new users */
router.post('/trustline',auth.basicAuth,auth.userAuth,
    wallet.trustline
);

/** gets the QRcode created with address of user */
router.get('/receive',auth.basicAuth,auth.userAuth,
    celebrate(WalletSchema.getBalance),
    wallet.receive
);

module.exports = router;