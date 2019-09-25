const responseData = require("./../utils/reponseStatus");
const sendResponse = require("../utils/response");
var db = require("./../models/index");
var APP_CONSTANT = require("./../utils/constants");
var randomGenerate = require("randomstring");
var commonFunc = require("./../utils/commonFunctions");
var requestIp = require("request-ip");
const config = require("config");
var cert = config.get("development.jwtSecret");
var Jwt = require("jsonwebtoken");
var message = require('../utils/responseMessages')
var moment = require('moment')

/* Function to create a new user */
module.exports.createNewUser = async function (req, res, next) {
  try {
    let payload = {
      type: APP_CONSTANT.PARAM_TYPE.EMAIL,
      value: req.body.email
    };

    /* Unique email check */
    let isEmailUnique = await commonFunc.validateUniqueness(payload);
    if (isEmailUnique && isEmailUnique.length > 0) {
      sendResponse(res, responseData.EMAIL_ALREADY_EXITS, {});
    } else {
      /* timestamp to use for token  */
      let timestamp = new Date().getTime();
      let newUser = new db.user({
        email: req.body.email,
        password: await commonFunc.encryptPassword(req.body.password),
        firstName: req.body.firstName,
        lastName: req.body.lastName || "",
        userName: await uniqueUsernameGenerator(req.body.firstName),
        platform: APP_CONSTANT.platform.WEB,
        createdAt: new Date().getTime(),
        updatedAt: new Date().getTime(),
        loginTime: timestamp
      });

      newUser
        .save()
        .then(async user => {
          user.loginTime = timestamp;
          let accessToken = await createToken(req.body, user);
          let createSessionEntry = await createSession(
            req.body,
            user,
            accessToken
          );
          sendResponse(res, responseData.SIGNUP_SUCCESS, {
            accessToken: accessToken
          });
        })
        .catch(error => {
          return Promise.reject(error);
        });
    }
  } catch (error) {
    next(error);
  }
};

module.exports.loginUser = async function (req, res, next) {
  try {
    let criteria = {
      email: req.body.email,
      status: APP_CONSTANT.userStatus.ACTIVE
    };
    req.body.ipAddress = requestIp.getClientIp(req);
    console.log(req.body.ipAddress, "------>>> IP")
    req.body.deviceType = req.body.deviceType || APP_CONSTANT.deviceType.WEB;

    // find user in db with active status
    let userData = await db.user
      .find(criteria)
      .lean()
      .exec();

    if (userData && userData.length > 0) {
      // check for correct password
      var checkPass = await commonFunc.decryptPassword(
        userData[0].password,
        req.body.password
      );

      if (!checkPass) {
        sendResponse(res, responseData.INVALID_CREDENTIALS, {});
      } else {
        let timestamp = new Date().getTime();

        // update user table with status login true
        let updateUser = await db.user
          .findByIdAndUpdate(
            { _id: userData[0]._id },
            { isLogin: true, loginTime: timestamp }
          )
          .lean()
          .exec();
        userData[0].loginTime = timestamp;

        // create accesstoken
        let accessToken = await createToken(req.body, userData[0]);

        // create session in db
        let createSessionEntry = await createSession(
          req.body,
          userData[0],
          accessToken
        );
        sendResponse(res, responseData.LOGIN_SUCCESS, {
          accessToken: accessToken,
          isWalletCreated: userData[0].IsWalletCreated,
          walletImported: userData[0].walletImported,
          IsLoanProvided: userData[0].IsLoanProvided,
          loanPaidOff: userData[0].loanPaidOff,
          address: userData[0].address
        });
      }
    } else {
      sendResponse(res, responseData.USER_DOESNOT_EXISTS, {});
    }
  } catch (error) {
    Promise.reject(error);
  }
};

module.exports.logOutUser = async function (req, res, next) {
  try {
    let logoutUser = await logoutPreviousSession(req.userData._id, req.tokenData.deviceId);
    let updateUserCollection = await db.user.findOneAndUpdate({ _id: req.userData._id }, {
      isLogin: false,
      loginTime: null
    }).exec()
    console.log(logoutUser, "---->> logout user");
    sendResponse(res, responseData.LOGOUT_SUCCESS, {});
  } catch (error) {
    Promise.reject(error);
  }
}

module.exports.changePassword = async function (req, res, next) {
  try {
    let checkOldPass = await commonFunc.decryptPassword(
      req.userData.password,
      req.body.oldPassword
    );

    if (checkOldPass) {
      let newPass = await commonFunc.encryptPassword(req.body.newPassword)
      let updatePassword = await db.user.findByIdAndUpdate({ _id: req.userData._id }, { password: newPass }).exec()
      sendResponse(res, responseData.PASSWORD_CHANGE_SUCCESSFULLY, {});
    } else {
      sendResponse(res, responseData.INVALID_OLD_PASSWORD, {});
    }
  } catch (error) {
    Promise.reject(error)
  }
}

module.exports.forgotPassword = async function (req, res) {
  try {
    let getUser = await db.user.find({ email: req.body.email, status: APP_CONSTANT.userStatus.ACTIVE }).exec()
    if (getUser && getUser.length > 0) {

      let createrRestoken = await createResetToken(getUser[0]);
      let updateUser = await db.user.findByIdAndUpdate({ _id: getUser[0]._id }, {
        passwordResetToken: {
          token: createrRestoken,
          status: false,
          expirationDate: new Date().getTime() + 10 * 60 * 1000
        }
      }).exec()
      //send email
      let resp = responseData.SIGNUP_SUCCESS
      resp.message = message.SUCCESS
      sendResponse(res, resp, { token: createrRestoken });

    } else {
      sendResponse(res, responseData.USER_DOESNOT_EXISTS, {});
    }

  } catch (error) {
    Promise.reject(error)
  }
}

module.exports.resetPassword = async function (req, res) {
  try {
    let decryptToken = await commonFunc.decrypt(req.body.token);
    let getUser = await db.user.find({ 'passwordResetToken.token': req.body.token }).exec()
    if (getUser && getUser.length > 0) {
      if (getUser[0].passwordResetToken.status || !moment(new Date()).isBefore(moment(new Date(getUser[0].passwordResetToken.expirationDate)))) {
        sendResponse(res, responseData.TOKEN_EXPIRED, {});
      } else {
        let newPass = await commonFunc.encryptPassword(req.body.password)
        let updatePassword = await db.user.findOneAndUpdate({ _id: getUser[0]._id }, { password: newPass, passwordResetToken: { status: true, token: '', expirationDate: '' } ,isLogin:false,loginTime : null}).exec();
        let clearSessions = await logoutPreviousSession(getUser[0]._id, '');
        sendResponse(res, responseData.PASSWORD_CHANGE_SUCCESSFULLY, {});
      }

    } else {
      sendResponse(res, responseData.TOKEN_EXPIRED, {});
    }

  } catch (error) {
    Promise.reject(error)
  }
}

module.exports.contactUs = async function (req, res) {
  try {

    let newSuggestion = new db.suggestions({
      subject: req.body.subject,
      message: req.body.message,
      userId : req.userData._id,
      createdAt: new Date().getTime(),
      updatedAt: new Date().getTime(),
    })

    newSuggestion.save()
    // send email
    sendResponse(res, responseData.CONTACT_US_SUCCESS, {});

  } catch (error) {
    Promise.reject(error)
  }
}

var createSession = async function (sessionData, userData, accessToken) {
  try {

    // single device login, logout old devices.
    let logoutOldDevice = await logoutPreviousSession(
      userData._id,
      sessionData.deviceId
    );

    // criteria to update in session
    let critera = {
      userId: userData._id,
      deviceId: sessionData.deviceId
    };

    // new session info
    let sessionInfo = {
      userId: userData._id,
      deviceId: sessionData.deviceId,
      deviceType: sessionData.deviceType,
      validAttempt: accessToken ? true : false,
      ipAddress: sessionData.ipAddress,
      loginStatus: true,
      createdAt: new Date().getTime(),
      deviceToken: ""
    };
    if (sessionData.appVersion)
      sessionInfo["appVersion"] = sessionData.appVersion;
    if (sessionData.deviceToken)
      sessionInfo["deviceToken"] = sessionData.deviceToken;
    if (sessionData.deviceModel)
      sessionInfo["deviceModel"] = sessionData.deviceModel;

    // create new session  
    let session = await db.session.update(critera, sessionInfo, {
      new: true,
      upsert: true
    });
    return;
  } catch (error) {
    return Promise.reject(error);
  }
};

var uniqueUsernameGenerator = async function (firstname) {
  console.log(firstname);
  let uniqueUsername =
    firstname.toLowerCase() +
    randomGenerate.generate({ length: 4, charset: "numeric" });
  let payload = {
    type: APP_CONSTANT.PARAM_TYPE.USERNAME,
    value: uniqueUsername
  };
  let check = await commonFunc.validateUniqueness(payload);
  console.log(uniqueUsername, "----------------------------------");
  if (check) {
    return uniqueUsername;
  } else {
    uniqueUsernameGenerator(firstname);
  }
};

var logoutPreviousSession = async function (userId, deviceId) {
  try {
    console.log(userId)
    let session = await db.session
      .findOneAndUpdate(
        { userId: userId },
        { loginStatus: false, updatedAt: new Date().getTime() },
        { new: true, multi: true }
      )
      .exec();
    return;
  } catch (error) {
    return Promise.reject(error);
  }
};

var createToken = async function (payload, userData) {
  try {
    let tokenData = {};
    let expiretime = config.get("development.access_token_expire_time");
    tokenData["id"] = userData._id;
    tokenData["deviceId"] = payload.deviceId;
    tokenData["timestamp"] = new Date().getTime();
    tokenData["loginTime"] = userData.loginTime;
    tokenData["rNumber"] = Math.floor(Math.random() * APP_CONSTANT.RANDOM_NUMBER_REFRESH_TOKEN) + 1;
    tokenData["exp"] = Math.floor(Date.now() / 1000) + expiretime;
    if (payload.appVersion) {
      tokenData["appVersion"] = payload.appVersion;
    }
    let accessToken = await setToken(tokenData);
    return accessToken["accessToken"];
  } catch (error) {
    return Promise.reject(error);
  }
};

var setToken = async function (tokenData) {
  try {
    let tokenToSend = await Jwt.sign(tokenData, cert, { algorithm: "HS256" });
    return { accessToken: tokenToSend };
  } catch (error) {
    return Promise.reject(error);
  }
};

var createResetToken = async function (data) {
  try {
    let encryptToken = await commonFunc.encrypt(data.email + "&" + new Date().getTime());
    return encryptToken
  } catch (error) {
    console.log(error)
  }
}