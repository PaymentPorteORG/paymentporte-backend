const stellarSdk = require('stellar-sdk');
const stellarHdWallet = require('stellar-hd-wallet');
const config = require('config');
var horizon = require('../utils/horizon');
const submitTx = require('../utils/submitTx');
const { ASSET , SUCCESS } = require('../utils/constants');
const sendResponse = require('../utils/response');
const { getPorteBal } = require('../utils/balances');
const wallet = require('../utils/getWallet');

/**
 * @method post
 * @description creates the wallet
 * @author Rohit Sethi
*/
module.exports.createWallet = function (req, res ,next){
    let password = req.body.password;
    try {
        //To do : check flags in DB
 
        let mnemonic = stellarHdWallet.generateMnemonic({entropyBits: 128}),   // To do : Ask user to save mnemonic as backup to restore wallet in future
            walletObj = wallet.encryptWallet(mnemonic,password);
        
        // To do : update DB
        sendResponse(res,SUCCESS.DEFAULT,{
            mnemonic : mnemonic,
            encWallet :walletObj.encWallet,
            address : walletObj.keyPair.publicKey()
        });
    } catch (error){
        next(error);
    }
}

/**
  * @method post
  * @description imports the wallet
  * @author Rohit Sethi
*/
module.exports.importWallet = function (req, res, next){
    let { mnemonic , password} = req.body;
    try {
        let walletObj = wallet.encryptWallet(mnemonic,password);
        sendResponse(res,SUCCESS.DEFAULT,{
            encWallet : walletObj.encWallet,
            address : walletObj.keyPair.publicKey()
        });
    } catch(error) {
        next(error);
    }
}

/**
  * @method post
  * @description decrypts the wallet data
  * @author Rohit Sethi
*/
module.exports.decryptWallet = function (req, res, next){
    let { encWallet , password} = req.body;
    try {
        let walletObj = wallet.decryptWallet(encWallet,password);
        sendResponse(res,SUCCESS.DEFAULT,{
            mnemonic :walletObj.mnemonic,
            address : walletObj.keyPair.publicKey()
        });
    } catch(error) {
        next(error);
    }
}

/**
 * @method post
 * @description provides loan to new users
 * @author Rohit Sethi
*/
module.exports.fundWallet = async function(req, res, next) {
    let { address } = req.body;
    let keyPair = stellarSdk.Keypair.fromSecret(config.get('development.fundingAccount.secretKey'));  
    let sourceAccount = await horizon.loadAccount(keyPair.publicKey());
    try {
        let builder = new stellarSdk.TransactionBuilder(sourceAccount,opts={fee:100});
        builder.addOperation(
            stellarSdk.Operation.createAccount({
            destination: address,
            startingBalance: "1.6"
        }));
        let txhash = await submitTx.processTx(builder,keyPair);
        
        // update data in DB
        // {
        //      address : "",
        //      mnemonic : "",
        //      credited : true,
        //      timeStamp : current-time
        // }

        sendResponse(res,SUCCESS.DEFAULT,{
                txhash : txhash
        });
    } catch(error) {
        next(error);
    }
}

/**
 * @method get
 * @description gets the wallet balance
 * @author Rohit Sethi
*/
module.exports.getBalance = async function(req,res,next) {
    let address = req.query.address;
    try {
        account = await horizon.loadAccount(address);
        let balPORTE = getPorteBal(account);
        let balXLM = (account.balances.filter(bal => bal.asset_type == 'native'))[0].balance

        sendResponse(res,SUCCESS.DEFAULT,{
            balPORTE : balPORTE,
            balXLM : balXLM
        });
    } catch (error) {
        next(error);
    }
}

/**
 * @method post
 * @description sends XLM/PORTE to other users
 * @author Rohit Sethi
*/
module.exports.send = async function (req, res, next){
    let { encWallet , password , destination , amount , isPorte } = req.body;
    try {    
        let walletObj = wallet.decryptWallet(encWallet,password);
        let sourceAccount = await horizon.loadAccount(walletObj.keyPair.publicKey())
        let builder = new stellarSdk.TransactionBuilder(sourceAccount,opts={fee:100});
        
        if (parseFloat(sourceAccount.balances[0].balance) < parseFloat(amount)) {
            throw new Error('insufficient balance');
        }

        let paymentObj = { 
            destination: destination,
            asset: stellarSdk.Asset.native(),
            amount: amount.toString()
        }
        if(isPorte)
            paymentObj.asset = new stellarSdk.Asset(ASSET.CODE, ASSET.ISSUER);

        builder.addOperation(stellarSdk.Operation.payment(paymentObj));
        let txhash =  await submitTx.processTx(builder,walletObj.keyPair);
        sendResponse(res,SUCCESS.DEFAULT,{
            txhash : txhash
        });
    } catch (error) {
        next(error);
    }
}

/**
 * @method post
 * @description get the transaction history and balance(XLM & PORTE)
 * @author Rohit Sethi
*/
module.exports.dashboard = async function(req,res,next){
    let { address } = req.query;
    try{
        account = await horizon.loadAccount(address);
        let balPORTE = getPorteBal(account);
        let balXLM = account.balances.filter(bal => bal.asset_type == 'native')[0].balance;
    
        let history = await horizon.payments()
                    .forAccount(address)
                    .limit('100')
                    .call();
        let txPORTE = history.records.filter(tx => tx.asset_code == ASSET.CODE);
        let txXLM = history.records.filter(tx => tx.asset_type == 'native');
        sendResponse(res,SUCCESS.DEFAULT,{
            txPORTE : txPORTE,
            txXLM  : txXLM, 
            balPORTE : balPORTE,
            balXLM : balXLM
        });
    } catch (error) {
        next(error);
    }
}

/**
 * @method post
 * @description sends loan amount back to funding account
 * @author Rohit Sethi
*/
module.exports.payCredits = async function (req,res,next){
    let { mnemonic } = req.body;  // for testing only
    try {

        let wallet = stellarHdWallet.fromMnemonic(mnemonic);        // get user's mnemonic from DB
        let keyPair = stellarSdk.Keypair.fromSecret(wallet.getSecret(0));        
        let sourceAccount = await horizon.loadAccount(wallet.getPublicKey(0));
        let builder = new stellarSdk.TransactionBuilder(sourceAccount,opts = { fee:100 });

        builder.addOperation(stellarSdk.Operation.payment({ 
            destination: config.get('development.fundingAccount.publicKey'),
            asset: stellarSdk.Asset.native(),
            amount: '1.6'
        }));
        let txhash =  await submitTx.processTx(builder,keyPair);

        //update DB.

        sendResponse(res,SUCCESS.DEFAULT,{
            txhash : txhash,
        });
    } catch (error) {
        next(error);
    }
}