var bcrypt = require("bcrypt");
const config = require("config");
var db = require("./../models/index");
var APP_CONSTANT = require("./../utils/constants");


module.exports.encryptPassword = function(password) {
  return new Promise((resolve, reject) => {
    resolve(bcrypt.hashSync(password, config.get("development.saltRounds")));
  });
};

module.exports.decryptPassword = function(oldPassword,newPassword) {
  return new Promise((resolve, reject) => {
    resolve(bcrypt.compareSync(newPassword,oldPassword))
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

