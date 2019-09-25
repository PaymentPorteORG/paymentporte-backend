const stellarSdk = require("stellar-sdk");
const stellarHdWallet = require("stellar-hd-wallet");
const config = require("config");
var horizon = require("../utils/horizon");
const submitTx = require("../utils/submitTx");
const { ASSET, SUCCESS } = require("../utils/constants");
const sendResponse = require("../utils/response");
const { getPorteBal } = require("../utils/balances");
const wallet = require("../utils/getWallet");
const responseData = require("./../utils/reponseStatus");
var db = require("./../models/index");
var message = require("./../utils/responseMessages");
var commonFunc = require("./../utils/commonFunctions");
const QRCode = require('qrcode');
const curl = new (require( 'curl-request' ))();
const constants = require('./../utils/constants')

/**
 * @method post
 * @description creates the wallet
 * @author Rohit Sethi
 */
module.exports.createWallet = async function(req, res, next) {
  let password = req.body.password;
  try {
    //check if wallet already exists
    console.log(req.userData.IsWalletCreated)
    if (req.userData.IsWalletCreated) {
      sendResponse(res, responseData.WALLET_ALREADY_EXISTS, {});
    } else {
      let mnemonic = stellarHdWallet.generateMnemonic({ entropyBits: 128 }), // To do : Ask user to save mnemonic as backup to restore wallet in future
        walletObj = wallet.encryptWallet(mnemonic, password);

      const mnemonicHash = await commonFunc.encrypt(mnemonic);
      console.log(mnemonicHash,"mnemonicHash---->>>")
      //update wallet info in db for user
      let updateUserInfo = await db.user
        .findOneAndUpdate(
          { _id: req.userData._id },
          {
            IsWalletCreated: true,
            //mnemonic: mnemonic,
            encryptedMnemonic:mnemonicHash,
            address: walletObj.keyPair.publicKey()
          }
        )
        .lean()
        .exec();

      sendResponse(res, SUCCESS.DEFAULT, {
        mnemonic: mnemonic,
        encWallet: walletObj.encWallet,
        address: walletObj.keyPair.publicKey()
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @method post
 * @description imports the wallet
 * @author Rohit Sethi
 */
module.exports.importWallet = async function(req, res, next) {
  let { mnemonic, password } = req.body;
  try {
    // let decryptedText = await commonFunc.decrypt(mnemonic)
    // console.log(decryptedText,"--->> decryptedText")
    let enableTrustline = false;
    let walletObj = wallet.encryptWallet(mnemonic, password);
    let account = await horizon.loadAccount(walletObj.keyPair.publicKey());
    let arrBalPORTE = account.balances.filter(bal => bal.asset_code == ASSET.CODE);
    if (arrBalPORTE.length == 0)
      enableTrustline = true;
    let updateuserInfo = await db.user.findOneAndUpdate({_id:req.userData._id},{walletImported: true}).lean().exec()
    sendResponse(res, SUCCESS.DEFAULT, {
      encWallet: walletObj.encWallet,
      address: walletObj.keyPair.publicKey(),
      enableTrustline : enableTrustline
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @method post
 * @description decrypts the wallet data
 * @author Rohit Sethi
 */
module.exports.decryptWallet = function(req, res, next) {
  let { encWallet, password } = req.body;
  try {
    let walletObj = wallet.decryptWallet(encWallet, password);
    sendResponse(res, SUCCESS.DEFAULT, {
      mnemonic: walletObj.mnemonic,
      address: walletObj.keyPair.publicKey(),
      privateKey : walletObj.keyPair.secret()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @method post
 * @description provides loan to new users
 * @author Rohit Sethi
 */
module.exports.fundWallet = async function(req, res, next) {
  
  try {
    let userData = await db.user
    .findOne({ _id: req.userData._id })
    .lean()
    .exec();
    
    if(userData.IsWalletCreated){
      sendResponse(res, responseData.WALLET_ALREADY_EXISTS, {}); 
    } else {
      let mnemonic = stellarHdWallet.generateMnemonic({ entropyBits: 128 });
      let wallet = stellarHdWallet.fromMnemonic(mnemonic);
      const mnemonicHash = await commonFunc.encrypt(mnemonic);
      let keyPair = stellarSdk.Keypair.fromSecret(
        config.get("development.fundingAccount.secretKey")
      );
      let sourceAccount = await horizon.loadAccount(keyPair.publicKey());

      if (userData.IsLoanProvided) {
        sendResponse(res, responseData.LOAN_ALREADY_PROVIDED, {});
      } else if (userData.loanCount > 0) {
        let response = responseData.LOAN_ALREADY_PROVIDED;
        response.message = message.NOT_ELIGIBLE;
        sendResponse(res, response, {});
      } else if (userData.IsLoanProvided && !userData.loanPaidOff) {
        sendResponse(res, responseData.LOAN_NOT_PAID_OFF, {});
      } else {
        let builder = new stellarSdk.TransactionBuilder(
          sourceAccount,
          (opts = { fee: 100 })
        );
        builder.addOperation(
          stellarSdk.Operation.createAccount({
            destination: wallet.getPublicKey(0),
            startingBalance: "1.6"
          })
        );
        let txhash = await submitTx.processTx(builder, keyPair);

        await db.user
        .findOneAndUpdate(
          { _id: req.userData._id },
          {
            IsWalletCreated: true,
            encryptedMnemonic: mnemonicHash,
            address: wallet.getPublicKey(0),
            IsLoanProvided: true,
            loanPaidOff: false,
            loanProvidedTime: new Date()
          }
        )
        .lean()
        .exec();
      
        sendResponse(res, SUCCESS.DEFAULT, {
          txhash: txhash
        });
      }
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @method get
 * @description gets the wallet balance
 * @author Rohit Sethi
 */
module.exports.getBalance = async function(req, res, next) {
  let address = req.query.address;
  try {
    account = await horizon.loadAccount(address);
    let balPORTE = getPorteBal(account);
    let balXLM = account.balances.filter(bal => bal.asset_type == "native")[0]
      .balance;

    sendResponse(res, SUCCESS.DEFAULT, {
      balPORTE: balPORTE,
      balXLM: balXLM
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @method post
 * @description sends XLM/PORTE to other users
 * @author Rohit Sethi
 */
module.exports.send = async function(req, res, next) {
  let { encWallet, password, destination, amount, isPorte } = req.body;
  try {
    let walletObj = wallet.decryptWallet(encWallet, password);
    let sourceAccount = await horizon.loadAccount(
      walletObj.keyPair.publicKey()
    );
    let builder = new stellarSdk.TransactionBuilder(
      sourceAccount,
      (opts = { fee: 100 })
    );

    
    
    if(isPorte) {
      let balPORTE = getPorteBal(sourceAccount);     
        if(balPORTE < parseFloat(amount)) 
        throw new Error("insufficient balance");
    } else {
      let balXLM = sourceAccount.balances.filter(bal => bal.asset_type == "native")[0]
      .balance;
      if (parseFloat(balXLM) < (parseFloat(amount) + 1.5)) {
        throw new Error("insufficient balance");
      }
    }

    let paymentObj = {
      destination: destination,
      asset: stellarSdk.Asset.native(),
      amount: amount.toString()
    };
    if (isPorte)
      paymentObj.asset = new stellarSdk.Asset(ASSET.CODE, ASSET.ISSUER);

    builder.addOperation(stellarSdk.Operation.payment(paymentObj));
    let txhash = await submitTx.processTx(builder, walletObj.keyPair);
    sendResponse(res, SUCCESS.DEFAULT, {
      txhash: txhash
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @method post
 * @description get the transaction history and balance(XLM & PORTE)
 * @author Rohit Sethi
 */
module.exports.dashboard = async function(req, res, next) {
  let { address } = req.query;
  try {
    account = await horizon.loadAccount(address);
    let balPORTE = getPorteBal(account);
    let balXLM = account.balances.filter(bal => bal.asset_type == "native")[0]
      .balance;

    let history = await horizon
      .payments()
      .forAccount(address)
      .limit("100")
      .call();
    let txPORTE = history.records.filter(tx => tx.asset_code == ASSET.CODE);
    let txXLM = history.records.filter(tx => tx.asset_type == "native");
    sendResponse(res, SUCCESS.DEFAULT, {
      txPORTE: txPORTE,
      txXLM: txXLM,
      balPORTE: balPORTE,
      balXLM: balXLM
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @method post
 * @description sends loan amount back to funding account
 * @author Rohit Sethi
 */
module.exports.payCredits = async function(req, res, next) {
  try {
    if (!req.userData.IsLoanProvided) {
      sendResponse(res, responseData.LOAN_NOT_EXISTS, {});
    } else if (req.userData.loanPaidOff) {
      sendResponse(res, responseData.NO_PENDING_AMOUNT, {});
    } else {
      let decryptedText = await commonFunc.decrypt(req.userData.encryptedMnemonic)
      console.log(decryptedText,"--->> decryptedText")
      let wallet = stellarHdWallet.fromMnemonic(decryptedText); // get user's mnemonic from DB
      let keyPair = stellarSdk.Keypair.fromSecret(wallet.getSecret(0));
      let sourceAccount = await horizon.loadAccount(wallet.getPublicKey(0));

      let balXLM = sourceAccount.balances.filter(bal => bal.asset_type == "native")[0]
      .balance;
      
      if (parseFloat(balXLM) < (parseFloat('1.6') + 1.5)) {
        throw new Error("insufficient balance");
      }

      let builder = new stellarSdk.TransactionBuilder(
        sourceAccount,
        (opts = { fee: 100 })
      );
      builder.addOperation(
        stellarSdk.Operation.payment({
          destination: config.get("development.fundingAccount.publicKey"),
          asset: stellarSdk.Asset.native(),
          amount: "1.6"
        })
      );
      let txhash = await submitTx.processTx(builder, keyPair);

      let updateUserInfo = await db.user
        .findOneAndUpdate(
          { _id: req.userData._id },
          {
            loanPaidOff: true,
            loanCount: 1,
            loanPaidOffTime: new Date(),
            IsLoanProvided: false
          }
        )
        .lean()
        .exec();

        let userData = await db.user.findOne({ _id: req.userData._id})
        .lean()
        .exec()

      //update DB.
        /*1) get mnemonic from db
          2) isloan provided , paidoff check
          3) all goes well update paidoff
        */

      sendResponse(res, SUCCESS.DEFAULT, {
        txhash: txhash,
        mnemonic : await commonFunc.decrypt(userData.encryptedMnemonic),
        address : userData.address
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports.trustline = async function(req, res, next){
  try {
    let criteria = { _id: req.userData._id }
    let userData = await db.user
    .findOne(criteria)
    .lean()
    .exec();
     console.log(userData);
    if(!userData.porteTrustLine) {
    console.log('------------------>>>>>>>>>>>>>',userData)
      let decryptMenomic = await commonFunc.decrypt(userData.encryptedMnemonic)
      let wallet = stellarHdWallet.fromMnemonic(decryptMenomic);
      let keyPair = stellarSdk.Keypair.fromSecret(wallet.getSecret(0))
      sourceAccount = await horizon.loadAccount(keyPair.publicKey()),
            builder = new stellarSdk.TransactionBuilder(sourceAccount,opts = { fee : 100 });

        builder.addOperation(stellarSdk.Operation.changeTrust({ 
            asset: new stellarSdk.Asset(ASSET.CODE, ASSET.ISSUER),
            limit: '100000'
        }));
        
        let txhash =  await submitTx.processTx(builder,keyPair);

        await db.user.findOneAndUpdate(criteria,{
          porteTrustLine : true
        })
        .lean()
        .exec()
        sendResponse(res,SUCCESS.DEFAULT,{
            txhash : txhash,
            address : keyPair.publicKey() 
        });
    } else {
      sendResponse(res,SUCCESS.DEFAULT,{
        address :userData.address
      });
    } 
  } catch (error) {
    next(error);
  }
}

module.exports.receive = async function(req, res, next) {
  let { address }= req.query
  try {
    let data =await QRCode.toDataURL(address);
    sendResponse(res,SUCCESS.DEFAULT,{
      QRcode : data
    });
  } catch (error) {
    next(error);
  }
}

module.exports.deleteMnemonic = async function(req, res, next) {
  try {
    let updateMnemonic = await db.user.findOneAndUpdate({_id: req.userData._id},{encryptedMnemonic : null}).lean().exec()
    sendResponse(res,SUCCESS.DEFAULT,{})

  } catch (error) {
    console.log(error)
    next(error);
  }
}

module.exports.currencyConversion = async function (req, res, next) {
  try {

    let url = 'https://api.coinbase.com/v2/prices/'+constants.BASE_CUURENCY+"-"+ constants.CONERSION_CURRENCY +'/buy';
      curl.get(url)
      .then(({ statusCode, body, headers }) => {
          let responseData = JSON.parse(body)
          sendResponse(res,SUCCESS.DEFAULT,responseData.data);
      })
      .catch((e) => {
        console.log(e);
        throw e
      });
  } catch (error) {
    next(error);
  }
}
