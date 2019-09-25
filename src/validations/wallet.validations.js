const { Joi } = require('celebrate');

const WALLET = {
    PASSWORD : Joi.string().min(6).required(),
    MNEMONIC : Joi.string().required(),
    ENCWALLET : Joi.string().required(),
    ADDRESS : Joi.string().length(56).required(),
    AMOUNT : Joi.number().required(),
    ISPORTE : Joi.boolean()   
}

module.exports.createWallet = {
    body: {
        password : WALLET.PASSWORD
    }
}

module.exports.importWallet = {
    body: {
        mnemonic : WALLET.MNEMONIC,
        password : WALLET.PASSWORD
    }
}

module.exports.decryptWallet = {
    body: {
        encWallet : WALLET.ENCWALLET,
        password : WALLET.PASSWORD
    }
}

module.exports.getBalance = {
    query: {
        address : WALLET.ADDRESS
    }
}

module.exports.dashboard = {
    query: {
        address : WALLET.ADDRESS
    }
}

module.exports.createTrustline = {
    body: {
        encWallet : WALLET.ENCWALLET,
        password : WALLET.PASSWORD
    }
}

module.exports.send = {
    body: {
        encWallet : WALLET.ENCWALLET,
        password : WALLET.PASSWORD,
        destination : WALLET.ADDRESS,
        amount : WALLET.AMOUNT,
        isPorte : WALLET.ISPORTE
    }
}

module.exports.currencyChange = {
    body: {
       currency1 : Joi.string().required(),
       currency2 : Joi.string().required(),
       amount : Joi.number().required(),
    }
}
