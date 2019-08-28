const sendResponse = require("../utils/response");
const responseData = require("../utils/reponseStatus");
var commonFunc = require("../utils/commonFunctions");
var requestIp = require("request-ip");
const config = require("config");
var cert = config.get("development.jwtSecret");
var Jwt = require("jsonwebtoken");
var db = require("../models/index");
var APP_CONSTANT = require("../utils/constants");
var message = require("../utils/responseMessages");
var auth = require("basic-auth");

module.exports.basicAuth = async (req, res, next) => {
  try {
    // extract the name and password from basic authorization
    let credentials = auth(req);
    // verify the authorization credentials
    if (
      credentials &&
      credentials.name === config.get("development.BASIC_USERNAME") &&
      credentials.pass === config.get("development.BASIC_PASSWORD")
    ) {
      next();
    } else {
      let missingAuth = message.MISSING_AUTH;
      return Promise.reject(
        sendResponse(res, responseData.UNAUTHORISED, {
          missingAuth: "Basic Auth"
        })
      );
    }
  } catch (error) {
    return Promise.reject(error);
  }
};

module.exports.userAuth = async (req, res, next) => {
  try {
    console.log("in user auth");
    let settings = {
      tokenType: "Bearer"
    };
    let authorization = req.headers.access_token;
    console.log(authorization)
    if (authorization) {
      const [tokenType, token] = authorization.split(/\s+/);
      if (
        !token ||
        tokenType.toLowerCase() !== settings.tokenType.toLowerCase()
      ) {
        let response = responseData.UNAUTHORISED;
        response.message = message.INVALID_TOKEN;
        return Promise.reject(sendResponse(res, response, {}));
      }

      let tokenData = await verifyToken(token);
      console.log(tokenData)
      if (!tokenData || !tokenData.userData) {
        let response = responseData.UNAUTHORISED;
        response.message = message.TOKEN_EXPIRED;
        return Promise.reject(sendResponse(res, tokenData, {}));
      } else {
        req.userData = tokenData.userData;
      }
    } else {
      return Promise.reject(
        sendResponse(res, responseData.UNAUTHORISED, {
          missingAuth: "User access token"
        })
      );
    }
  } catch (error) {
    return Promise.reject(error);
  }
  await next();
};

let verifyToken = async function(token) {
  try {
    let tokenInfo = {};
    let result = await Jwt.verify(token, cert, { algorithms: ["HS256"] });
    if (result) {
      let user = await db.user
        .findById(result.id)
        .lean()
        .exec();
      if (user && user.status == APP_CONSTANT.userStatus.ACTIVE) {
        if (result.loginTime == user.loginTime) {
          tokenInfo.userData = user;
          // return tokenInfo;
        } else {
          let response = responseData.UNAUTHORISED;
          response.message = message.SESSION_EXPIRED;
          tokenInfo = response;
          // return tokenInfo;
        }
      } else {
        let response = responseData.UNAUTHORISED;
        response.message = message.UNAUTHORISED;
        tokenInfo = response;
        // return tokenInfo;
      }
      return tokenInfo
    } else {
      let response = responseData.UNAUTHORISED;
      response.message = message.INVALID_TOKEN;
      tokenInfo = response
      return tokenInfo;
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
};
