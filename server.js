const express = require('express');
const bodyParser = require('body-parser');
const logger = require('./src/utils/logger')
const config = require('config');
var cors = require('cors');
var cookieParser = require('cookie-parser');
const session = require('express-session');
const Middlewares = require('./src/middleware/handlers');

const app = express();
app.use(cors());
app.use(cookieParser());
app.use(
    session({
      secret: 'qwerty',
      cookie:{_expires : 3000000 }, // time im ms
      resave: true,
      saveUninitialized: true
    })
);

const createWallet = require('./src/routes/wallet');

const PORT = config.get('development.server.port');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use((req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl}`)
    next()
})

app.use('/wallet', createWallet);

app.use(Middlewares.ErrorHandler);
app.use(Middlewares.InvalidRoute);

app.listen(PORT, function(){
    logger.info(`server started on PORT : ${PORT}`)
});