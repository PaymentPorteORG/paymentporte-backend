const express = require('express');
const app = express();
const router = express.Router();
const stellarSdk = require('stellar-sdk');
const stellarHdWallet = require('stellar-hd-wallet');
const logger = require('../utils/logger');
const config = require('config');
var horizon = require('../utils/horizon');

router.post('/createWallet', function (req, res){
    try {
        let mnemonic = stellarHdWallet.generateMnemonic({entropyBits: 128});   // To do : Ask user to save mnemonic as backup to restore wallet in future
        let wallet = stellarHdWallet.fromMnemonic(mnemonic);
        res.status(200).send({ 
            status : 'success',
            mnemonic : mnemonic ,
            publicKey : wallet.getPublicKey(0)
        });
    } catch (error){
        logger.info(error);
        res.status(500).send({ 
            status: 'failure',
            error : error.message
        });
    }
});

router.post('/importWallet', function (req, res){
    let { mnemonic } = req.body;
    try {
        if(!stellarHdWallet.validateMnemonic(mnemonic))
            throw new Error('Invalid mnemonic');
        let wallet = stellarHdWallet.fromMnemonic(mnemonic);
        res.status(200).send({
            status : 'success',
            wallet : wallet,
            publicKey : wallet.getPublicKey(0)
        });
    } catch(error) {
        logger.info(error);
        res.status(500).send({
            status: 'failure',
            error : error.message
        });
    }
});

router.post('/fundWallet',async function(req,res) {
    let { publicKey } = req.body;
    let sourceKeys = stellarSdk.Keypair.fromSecret(config.get('development.fundingAccount.secretKey'));
    let sourceAccount = await horizon.loadAccount(sourceKeys.publicKey());
    try {
        let builder = new stellarSdk.TransactionBuilder(sourceAccount,opts={fee:100});
        builder.addOperation(
            stellarSdk.Operation.createAccount({
            destination: publicKey,
            startingBalance: "1.6"
        }))
        let tx = await builder.setTimeout(180).build()
        await tx.sign(sourceKeys);
        
        let txResult = await horizon.submitTransaction(tx);
        res.status(200).send({
            status : 'success',
            txDetails : txResult
        });
    } catch(error) {
        logger.info(error);
        res.status(500).send({
            status : "failure" ,
            error : error.message });
    }
})

// router.post('/encryptWallet', async function(req,res){
//     let { password , mnemonic } = req.body;
//     try {
//     } catch(error) {
//     }
// });

// router.post('/decryptWallet',async function(req,res){
//     let { password , encryptedWallet } = req.body;
//     try {
//     } catch (error) {
//     }    
// })

router.get('/getBalance',async function(req,res) {
    let address = req.body.address;
    try {
        account = await horizon.loadAccount(address);
        res.status(200).send({
            status : "success",
            balances : account.balances[0]
        });
    } catch (error) {
        logger.info(error);
        res.status(500).send({
            status : "failure",
            error : error.message
        });
    }
})

module.exports = router;