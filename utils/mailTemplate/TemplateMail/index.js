const nodemailer = require('nodemailer'),
    creds = require('./creds'),
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: creds.user,
            pass: creds.pass,
        },
    }),
    EmailTemplate = require('email-templates').EmailTemplate,
    path = require('path'),
    Promise = require('bluebird');

var link = require('../../../config.json').links.verifyLink;

module.exports.mailing = function(body, email, name, dappid){

    let users = [
        {
            name: name,
            email: email,
            link: link + "?" + JSON.stringify(body) + "&^&" + dappid,
        }
    ];

    function sendEmail (obj) {
        return transporter.sendMail(obj);
    }

    function loadTemplate (templateName, contexts) {
        let template = new EmailTemplate(path.join(__dirname, 'templates', templateName));
        return Promise.all(contexts.map((context) => {
            return new Promise((resolve, reject) => {
                template.render(context, (err, result) => {
                    if (err) reject(err);
                    else resolve({
                        email: result,
                        context,
                    });
                });
            });
        }));
    }

    loadTemplate('payslip', users).then((results) => {
        return Promise.all(results.map((result) => {
            sendEmail({
                to: result.context.email,
                from: 'venkatreddygudla@gmail.com',
                subject: result.email.subject,
                html: result.email.html,
                text: result.email.text,
                body: "hey man"
            });
        }));
    }).then(() => {
        console.log('email sent yo!');
    });

}
