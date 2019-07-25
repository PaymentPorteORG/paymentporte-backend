const express = require('express');
const bodyParser = require('body-parser');
const logger = require('./utils/logger')
const config = require('config');

const app = express();

const wallet = require('./routes/wallet.js');
const trustline = require('./routes/trustline');
const transaction = require('./routes/transaction');

const PORT = config.get('development.server.port');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use((req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl}`)
    next()
})

app.use('/', wallet);
app.use('/',trustline);
app.use('/',transaction)
app.get('*', function(req, res) {
    res.redirect('/');
});

app.listen(PORT, function(){
    logger.info(`server started on PORT : ${PORT}`)
});