const express = require('express');
const app = express();
const router = express.Router();
const wallet = require('../controllers/wallet');
const operations = require('../controllers/operations');
const { celebrate } = require('celebrate');
const WalletSchema = require('../validations/wallet.validations')

/** creates a new wallet for the user */
router.post('/createWallet',
    celebrate(WalletSchema.createWallet),
    wallet.createWallet
);

/** imports the user wallet */
router.post('/importWallet',
    celebrate(WalletSchema.importWallet),
    wallet.importWallet
);

/** decrypt the user wallet data */
router.post('/decryptWallet',
    celebrate(WalletSchema.decryptWallet),
    wallet.decryptWallet
);

/** provides loan to new users */
router.post('/fundWallet',
    wallet.fundWallet
);

/** gets the balance of user wallet */
router.get('/getBalance',
    celebrate(WalletSchema.getBalance),
    wallet.getBalance
);

/** merge user's account with funding account to recover loan funds */
router.post('/deleteAccount',
    operations.deleteAccount
);

/** returns the wallet balance and transaction history */
router.get('/dashboard',
    celebrate(WalletSchema.dashboard),
    wallet.dashboard
);

/** creates a trustline with PORTE token */
router.post('/createTrustline',
    celebrate(WalletSchema.createTrustline),
    operations.createTrustline
);

/** sends the PORTE/XLM to others*/
router.post('/send',
    celebrate(WalletSchema.send),
    wallet.send
);

/** pays off the loan provided on wallet creation */
router.post('/payCredits',
    wallet.payCredits
);

module.exports = router;