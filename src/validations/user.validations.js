const { Joi } = require('celebrate');

const USER = {
    PASSWORD : Joi.string().min(6).required(),
    EMAIL : Joi.string().required(),
    FIRSTNAME : Joi.string().required(),
    LASTNAME : Joi.string().required(),
    DEVICEID : Joi.string().required()
}

module.exports.userSignUp = {
    body: {
        email : USER.EMAIL,
        password : USER.PASSWORD,
        firstName : USER.FIRSTNAME,
        lastName : USER.LASTNAME,
        deviceId : USER.DEVICEID,
    }
}

module.exports.userLogIn = {
    body: {
        email : USER.EMAIL,
        password : USER.PASSWORD,
        deviceId : USER.DEVICEID,
    }
}

module.exports.changePassword = {
    body: {
        oldPassword : USER.EMAIL,
        newPassword : USER.PASSWORD
    }
}

module.exports.forgotPassword = {
    body:{
        email : USER.EMAIL
    }
}

module.exports.resetPassword = {
    body:{
        token :  Joi.string().required(),
        password : USER.PASSWORD
    }
}

module.exports.contactUs = {
    body:{
        subject : Joi.string().required(),
        message : Joi.string().required()
    }
}