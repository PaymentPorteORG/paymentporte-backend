const config = require('config');
const mongoose = require('mongoose');
const mongoDbUrl = config.get('development.dbConfig.dbUrl')
const db = require('./../models/index');
const commonFunc = require('./../utils/commonFunctions')
module.exports.connectMongoDatabase = function () {
    try {
        mongoose.set('debug', true)
        mongoose.set('useFindAndModify', false)
        mongoose.connect(mongoDbUrl, { useNewUrlParser: true }).then(async() => {
            console.info(`Connected to ${mongoDbUrl}`)
            let getUsers = await db.user.find({}).exec();
            console.log(getUsers.length)
            if(getUsers && getUsers.length > 0){
                for(let i =0 ; i<getUsers.length;i++){
                    if(getUsers[i].mnemonic){
                        console.log("changing mnemonic")
                        let encrypt= await commonFunc.encrypt(getUsers[i].mnemonic)
                        let updateUser = db.user.findOneAndUpdate({_id: getUsers[i]._id},{encryptedMnemonic:encryptedMnemonic}).exec()
                    }
                }
            }
        }).catch(err => {
            return Promise.reject(err)
        })
        return {}
    } catch (err) {
        throw err
    }
}