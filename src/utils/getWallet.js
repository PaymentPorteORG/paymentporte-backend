/**
 * @file getWallet
 * @description decrypts the wallet 
 * @author Rohit Sethi
*/

const stellarSdk = require('stellar-sdk');
const stellarHdWallet = require('stellar-hd-wallet');
const AES = require('../utils/AES');

/** decrypts wallet and returns mnemonic */
module.exports.decryptWallet =function(encWallet,password){
    let mnemonic = AES.decrypt(password,encWallet),
        wallet = stellarHdWallet.fromMnemonic(mnemonic);
        
    return { 
        mnemonic : mnemonic,
        keyPair : stellarSdk.Keypair.fromSecret(wallet.getSecret(0))
    };
}

/** encrypts mnemonic with password */
module.exports.encryptWallet =function(mnemonic,password){
    let encWallet = AES.encrypt(password,mnemonic),
        wallet = stellarHdWallet.fromMnemonic(mnemonic);
        
    return { 
        encWallet : encWallet,
        keyPair : stellarSdk.Keypair.fromSecret(wallet.getSecret(0)) 
    };
}