var cron = require('node-cron');
var db = require("./models/index");
let constantStatus = require("./utils/constants");
var moment = require('moment');
var operation = require('./../src/controllers/operations')
var commonFunc = require('./utils/commonFunctions')
module.exports.runCron =async function (req, res, next){
    console.log("in cron")
    cron.schedule('* * * * *', async () => {
        console.log('running a task every minute');
        deleteMnemonic()
        // checkOutNotification();
        // autoCancellation();
    });
}


var deleteMnemonic = async function(){
    let getUsers = await db.user.find({status: constantStatus.userStatus.ACTIVE,loanPaidOff:false,IsLoanProvided:true},{loanProvidedTime:1,encryptedMnemonic:1}).lean().exec()
    if(getUsers && getUsers.length>0){
        for(let i= 0; i<getUsers.length > 0;i++){
            let loanDate = moment(getUsers[i].loanProvidedTime)
            let currentDate = moment()
            let diffrence = currentDate.diff(loanDate,'days')
            console.log(diffrence,"----------->>",getUsers[i])
            if(diffrence >= 30){
                let decryptMnemonic = await commonFunc.decrypt(getUsers[i].encryptedMnemonic)
                console.log(decryptMnemonic,"mnemonic")
                let updateUser = await operation.deleteAccount({_id:getUsers[i]._id, mnemonic : decryptMnemonic})
            }
        }
    }
}