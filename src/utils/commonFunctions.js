var bcrypt = require("bcrypt");
const config = require("config");
var db = require("./../models/index");
var APP_CONSTANT = require("./../utils/constants");
const crypto = require("crypto");
const secret = config.get("development.ENCRYPTING_SECRET");


module.exports.encryptPassword = function(password) {
  return new Promise((resolve, reject) => {
    resolve(bcrypt.hashSync(password, config.get("development.saltRounds")));
  });
};

module.exports.decryptPassword = function(oldPassword, newPassword) {
  return new Promise((resolve, reject) => {
    resolve(bcrypt.compareSync(newPassword, oldPassword));
  });
};

module.exports.validateUniqueness = function(params) {
  try {
    return new Promise(async (resolve, reject) => {
      let condition = {
        status: APP_CONSTANT.userStatus.ACTIVE
      };
      if (params.type == APP_CONSTANT.PARAM_TYPE.EMAIL) {
        condition["email"] = params.value;
      } else if (params.type == APP_CONSTANT.PARAM_TYPE.USERNAME) {
        condition["username"] = params.value;
      }
      let isUnique = await db.user
        .find(condition)
        .lean()
        .exec();
      resolve(isUnique);
    });
  } catch (error) {
    next(error);
  }
};

module.exports.encrypt = function(text) {
  try{
    let cipher = crypto.createCipher("aes-256-cbc", secret);
    let encrypted = cipher.update(text,'utf8','hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }catch(error){
    console.log(error)
  }
};

module.exports.decrypt = function(text) {
  var decipher = crypto.createDecipher('aes-256-cbc',secret)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
};
