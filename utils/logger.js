const { createLogger, format, transports } = require('winston');
var fs = require( 'fs' );
var path = require('path');

var logDir = 'logs'; // directory path you want to set
if ( !fs.existsSync( logDir ) ) {
    // Create the directory if it does not exist
    fs.mkdirSync( logDir );
}

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'stellar-wallet' },
  transports: [
    //
    // - Write to all logs with level `info` and below to `quick-start-combined.log`.
    // - Write all logs error (and below) to `quick-start-error.log`.
    //
    new transports.File({ filename: path.join(logDir, '/error.log'), level: 'error' }),
    new transports.File({ filename: path.join(logDir, '/combined.log') })
  ]
});

logger.add(new transports.Console({
  format: format.combine(
    format.colorize(),
    format.simple()
  )
}));

module.exports = logger;