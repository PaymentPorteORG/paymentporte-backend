const express = require('express');
const app = express();
const router = express.Router();
const stellarSdk = require('stellar-sdk');
const stellarHdWallet = require('stellar-hd-wallet');
const logger = require('../utils/logger');
const config = require('config');
var horizon = require('../utils/horizon');

let assetCode = 'COOL';
let issuerAdd = 'GANQDVASPYIVJF7YJNFZJ6DPXEWKI57NRYVSC7WYM6ZAL5J7FVPXS3NU';

// router.post('/createTrustline',async function(req,res) {
//     let wallet = req.body.wallet;
//     console.log(JSON.parse(wallet));
//     let sourceAccount = await horizon.loadAccount(wallet.getPublicKey(0));
//     try {
//         let builder = new StellarSdk.TransactionBuilder(sourceAccount,opts = { fee : 100 });
//         builder.addOperation(StellarSdk.Operation.changeTrust({ 
//             asset: new StellarSdk.Asset(assetCode, issuerAdd),
//             limit: trustLimit,
//             source: wallet
//         }))
//         let txhash =  await processTx(builder,wallet);
//         res.status(200).send({
//             status : "success",
//             txhash : txhash
//         })

//     } catch (error) {
//         logger.info(error);
//         res.status(500).send({
//             status : "failure" ,
//             error : error.message 
//         });
//     }
// })

// async function processTx(builder,wallet) {
//     let tx = await builder.setTimeout(180).build()
//     let secret = wallet.getsecret(0);
    
//     await tx.sign(StellarSdk.Keypair.fromSecret(secret))
//     let txResult = await horizon.submitTransaction(tx)
//     return txResult.hash;
// }

module.exports = router;