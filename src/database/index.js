const config = require('config');
const mongoose = require('mongoose');
const mongoDbUrl = config.get('development.dbConfig.dbUrl')

module.exports.connectMongoDatabase = function () {
    try {
        mongoose.set('debug', true)
        mongoose.set('useFindAndModify', false)
        mongoose.connect(mongoDbUrl, { useNewUrlParser: true }).then(() => {
            console.info(`Connected to ${mongoDbUrl}`)
        }).catch(err => {
            return Promise.reject(err)
        })
        return {}
    } catch (err) {
        throw err
    }
}