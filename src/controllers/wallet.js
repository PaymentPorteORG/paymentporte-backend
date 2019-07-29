const stellarSdk = require('stellar-sdk');
const stellarHdWallet = require('stellar-hd-wallet');
const logger = require('../utils/logger');
const config = require('config');
const secretStorage = require('../utils/secretStorage');
var horizon = require('../utils/horizon');

module.exports.createWallet = function (req, res){
    let password = req.body.password;
    try {
        if(password.length < 6 || password.length > 20)
            throw new Error('password must be of minimum 4 characters ');
        let mnemonic = stellarHdWallet.generateMnemonic({entropyBits: 128});   // To do : Ask user to save mnemonic as backup to restore wallet in future
        let encMnemonic = secretStorage.encrypt(password,mnemonic);
        let wallet = stellarHdWallet.fromMnemonic(mnemonic);
        res.status(200).send({
            statusCode : 200,
            status : 'success',
            data : {
                mnemonic : mnemonic,
                encWallet : encMnemonic,
                publicKey : wallet.getPublicKey(0)
            }
        });
    } catch (error){
        logger.error(error);
        res.status(500).send({
            statusCode : 500,
            status: 'failure',
            error : error.message
        });
    }
}

module.exports.importWallet = function (req, res){
    let { mnemonic , password} = req.body;
    try {
        if(!stellarHdWallet.validateMnemonic(mnemonic))
            throw new Error('Invalid mnemonic');
        let wallet = stellarHdWallet.fromMnemonic(mnemonic);
        let encMnemonic = secretStorage.encrypt(password,mnemonic);
        res.status(200).send({
            statusCode : 200,
            status : 'success',
            data : {
                encWallet : encMnemonic,
                publicKey : wallet.getPublicKey(0)
            }
        });
    } catch(error) {
        logger.error(error);
        res.status(500).send({
            statusCode : 500,
            status: 'failure',
            error : error.message
        });
    }
}

module.exports.decryptWallet = function (req, res){
    let { encWallet , password} = req.body;
    try {
        let mnemonic = secretStorage.decrypt(password,encWallet);
        let wallet = stellarHdWallet.fromMnemonic(mnemonic);
        res.status(200).send({
            statusCode : 200,
            status : 'success',
            data : {
                mnemonic : mnemonic,
                publicKey : wallet.getPublicKey(0)
            }
        });
    } catch(error) {
        logger.error(error);
        res.status(500).send({
            statusCode : 500,
            status: 'failure',
            error : error.message
        });
    }
}

module.exports.fundWallet = async function(req,res) {
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
            statusCode : 200,
            status : 'success',
            data : {
                txDetails : txResult
            }  
        });
    } catch(error) {
        logger.error(error);
        res.status(500).send({
            statusCode : 500,
            status : "failure" ,
            error : error.message });
    }
}

module.exports.getBalance = async function(req,res) {
    let address = req.body.address;
    try {
        account = await horizon.loadAccount(address);
        res.status(200).send({
            statusCode : 200,
            status : "success",
            data : {
                balances : account.balances[0]
            }
        });
    } catch (error) {
        logger.error(error);
        res.status(500).send({
            statusCode : 500,
            status : "failure",
            error : error.message
        });
    }
}
