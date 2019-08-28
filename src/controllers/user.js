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

/* Function to create a new user */
module.exports.createNewUser = async function(req, res, next) {
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

module.exports.loginUser = async function(req, res, next) {
  try {
    let criteria = {
      email: req.body.email,
      status: APP_CONSTANT.userStatus.ACTIVE
    };
    req.body.ipAddress = requestIp.getClientIp(req);
    req.body.deviceType = req.body.deviceType || APP_CONSTANT.deviceType.WEB;
    let userData = await db.user
      .find(criteria)
      .lean()
      .exec();
    if (userData && userData.length > 0) {
      var checkPass = await commonFunc.decryptPassword(
        userData[0].password,
        req.body.password
      );
      if (!checkPass) {
        sendResponse(res, responseData.INVALID_CREDENTIALS, {});
      } else {
        let timestamp = new Date().getTime();
        let updateUser = await db.user
          .findByIdAndUpdate(
            { _id: userData[0]._id },
            { isLogin: true, loginTime: timestamp }
          )
          .lean()
          .exec();
        userData[0].loginTime = timestamp;
        let accessToken = await createToken(req.body, userData[0]);
        let createSessionEntry = await createSession(
          req.body,
          userData[0],
          accessToken
        );
        let isWalletCreated = false;
        if(userData[0].IsWalletCreated) {
          isWalletCreated = true;
        }
        sendResponse(res, responseData.LOGIN_SUCCESS, {
          accessToken: accessToken,
          isWalletCreated : isWalletCreated
        });
      }
    } else {
      sendResponse(res, responseData.USER_DOESNOT_EXISTS, {});
    }
  } catch (error) {
    Promise.reject(error);
  }
};

var createSession = async function(sessionData, userData, accessToken) {
  try {
    let logoutOldDevice = await logoutPreviousSession(
      userData._id,
      sessionData.deviceId
    );
    let critera = {
      userId: userData._id,
      deviceId: sessionData.deviceId
    };
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
    let session = await db.session.update(critera, sessionInfo, {
      new: true,
      upsert: true
    });
    return;
  } catch (error) {
    return Promise.reject(error);
  }
};

var uniqueUsernameGenerator = async function(firstname) {
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

var logoutPreviousSession = async function(userId, deviceId) {
  try {
    let session = await db.session
      .findOneAndUpdate(
        { _id: userId },
        { loginStatus: false, updatedAt: new Date().getTime() },
        { new: true, multi: true }
      )
      .exec();
    return;
  } catch (error) {
    return Promise.reject(error);
  }
};

var createToken = async function(payload, userData) {
  try {
    let tokenData = {};
    let expiretime = config.get("development.access_token_expire_time");
    tokenData["id"] = userData._id;
    tokenData["deviceId"] = payload.deviceId;
    tokenData["timestamp"] = new Date().getTime();
    tokenData["loginTime"] = userData.loginTime;
    tokenData["rNumber"] =
      Math.floor(Math.random() * APP_CONSTANT.RANDOM_NUMBER_REFRESH_TOKEN) + 1;
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

var setToken = async function(tokenData) {
  try {
    let tokenToSend = await Jwt.sign(tokenData, cert, { algorithm: "HS256" });
    return { accessToken: tokenToSend };
  } catch (error) {
    return Promise.reject(error);
  }
};
