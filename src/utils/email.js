
// import * as nodemailer from 'nodemailer';
// import * as config from 'config'
let ejs = require('ejs');
var nodemailer = require('nodemailer');
const config = require('config');


module.exports.getHtml = function (filename, data, options) {
    return new Promise((resolve, reject) => {
        try {
            let paths = process.cwd() + "/src/views/" + filename
            let self = this
            ejs.renderFile(paths, data, options, function (err, str) {
                if (err) {
                    console.log("ejs error", err)
                }
                else {
                    self.sendMail(options.email, options.subject, str)
                }
            })

        } catch (error) {
            console.log('get html content', error)
        }
    })
}

module.exports.sendMail = function (receiverEmail, subject, content) {
    return new Promise((resolve, reject) => {
        try {
            let transporter = nodemailer.createTransport({
                host: config.get('development.HOST'),
                port: config.get('development.port'),
                secure: false, // upgrade later with STARTTLS   || true for 465, false for other ports
                tls: { rejectUnauthorized: false },
                auth: {
                    user: config.get('development.smtp.mailUsername'),
                    pass: config.get('development.smtp.mailPassword')
                },
                authMethod: 'PLAIN'
            });
            let senderEmail = config.get('development.smtp.from')
            let mailOptions = {
                from: senderEmail,      // sender email
                to: receiverEmail, // list of receivers
                subject: subject,  // Subject line
                html: content,
                // bcc: config.get('smtp.bccMail')
            };
            transporter.sendMail(mailOptions, function (error, response) {
                if (error) {
                    console.log("Message Not Send", error);
                } else {
                    console.log("Message sent!");
                }
            })
        } catch (error) {
            console.log("Message sent!",error);
        };
    })
}