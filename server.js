const express = require('express');
const bodyParser = require('body-parser');
const logger = require('./src/utils/logger')
const config = require('config');
var cors = require('cors');

const app = express();
app.use(cors());

const createWallet = require('./src/routes/createWallet.js');
const trustline = require('./src/routes/trustline');
const transaction = require('./src/routes/transaction');

const PORT = config.get('development.server.port');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use((req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl}`)
    next()
})

app.use('/', createWallet);
app.use('/',trustline);
app.use('/',transaction)
app.get('*', function(req, res) {
    res.redirect('/');
});

app.listen(PORT, function(){
    logger.info(`server started on PORT : ${PORT}`)
});