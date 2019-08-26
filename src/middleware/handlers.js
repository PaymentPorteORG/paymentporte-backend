const logger = require('../utils/logger');
const { isCelebrate } =  require("celebrate");

module.exports.ErrorHandler = (err,req,res,next) => {
    if (isCelebrate(err)) {
        logger.error(err.joi.details[0]);
        return res.status(400).send({
            success: false,
            statusCode: 400,
            key: err.joi.details[0].context.key,
            message: err.joi.details[0].message.replace(/"/g, '')
        });
    } else if(err.message == 'Unsupported state or unable to authenticate data') {
        logger.error(err);
        err.message = 'incorrect pin or wallet not found';
        return res.status(500).send({
            success: false,
            message: err.message,
            statusCode: 500
        });
    }  else {
        logger.error(err);
        return res.status(500).json({
            success: false,
            statusCode: 500,
            message: err.message
        });
    }
}

module.exports.InvalidRoute = (req, res, next) => {
    res.status(404).send({
        success: false,
        message: 'Invalid route',
        statusCode: 404
    });
}