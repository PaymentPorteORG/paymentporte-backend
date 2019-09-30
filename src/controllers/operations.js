const stellarSdk = require('stellar-sdk');
var horizon = require('../utils/horizon');
const config = require('config');
const stellarHdWallet = require("stellar-hd-wallet");
const submitTx = require('../utils/submitTx');
const sendResponse = require('../utils/response');
const { ASSET , SUCCESS } = require('../utils/constants');
const wallet = require('../utils/getWallet');
var db = require("./../models/index");


module.exports.createTrustline = async function (req, res, next){
    let { encWallet , password } = req.body;
    try {
        let walletObj = wallet.decryptWallet(encWallet,password),
            sourceAccount = await horizon.loadAccount(walletObj.keyPair.publicKey()),
            builder = new stellarSdk.TransactionBuilder(sourceAccount,opts = { fee : 100 });

        builder.addOperation(stellarSdk.Operation.changeTrust({ 
            asset: new stellarSdk.Asset(ASSET.CODE, ASSET.ISSUER),
            limit: '100000'
        }));
        
        let txhash =  await submitTx.processTx(builder,walletObj.keyPair);
        sendResponse(res,SUCCESS.DEFAULT,{
            txhash : txhash
        });
    } catch (error) {
        next(error);
    }
}

module.exports.deleteAccount = async function (userData){
    try {
        // To do : get mnemonic of user form DB and get wallet to perform merge account
        console.log(userData,"-------------->>>>>>> userdata")
        let wallet = stellarHdWallet.fromMnemonic(userData.mnemonic);
        let keyPair = stellarSdk.Keypair.fromSecret(wallet.getSecret(0))
        // let wallet = stellarHdWallet.fromMnemonic(mnemonic);
        // let keyPair = stellarSdk.Keypair.fromSecret('SACTKGBEQ4766H4BTYFZ7OVI2GLVYYARLKW4JN5FFIIRQ3PMDLQ72XY5');   // user's mnemonic(stored in DB)
        // let keyPair = stellarSdk.Keypair.fromSecret('SACTKGBEQ4766H4BTYFZ7OVI2GLVYYARLKW4JN5FFIIRQ3PMDLQ72XY5');   // user's mnemonic(stored in DB)
        let sourceAccount = await horizon.loadAccount(keyPair.publicKey());
        
        let builder = new stellarSdk.TransactionBuilder(sourceAccount,opts= { fee : 100 });
        
        builder.addOperation(stellarSdk.Operation.accountMerge({ 
            destination: config.get('development.fundingAccount.publicKey')
        }))
        let txhash =  await submitTx.processTx(builder,keyPair);
        // update DB 

        let updateUser = await db.user({_id: userData._id},{
            IsWalletCreated:false,
            IsLoanProvided: false,
            loanCount:0,
            walletImported: false,
            address: null,
            encryptedMnemonic: null,
            $unset : { loanPaidOff : 1} 
        }).exec()
        return true
        // sendResponse(res,SUCCESS.DEFAULT,{
        //     txhash : txhash
        // })
    } catch (error){
        console.log(error)
        throw error
       
    }
}