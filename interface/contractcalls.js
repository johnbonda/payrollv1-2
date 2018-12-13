var ByteBuffer = require("bytebuffer");
var util = require("../utils/util.js");
var mail = require("../utils/sendmail");
var api = require("../utils/api");
var SwaggerCall = require("../utils/SwaggerCall");
var SuperDappCall = require("../utils/SuperDappCall")
var TokenCall = require("../utils/TokenCall");
var mailer = require("../utils/mailTemplate/TemplateMail/index");
var registrationMail = require("../utils/mailTemplate/TemplateMail/register");
var addressquery = require("../utils/mailTemplate/TemplateMail/addressquery");
var register = require("../interface/register");
var registrations = require("../interface/registrations");
var auth = require("../interface/authController");


app.route.post("/issueTransactionCall", async function(req, res){
    var transactionParams = {};
    var pid = req.query.pid;
    var payslip = await app.model.Payslip.findOne({
        condition: {
            pid: pid
        }
    });

    if(!payslip) return "Invalid Payslip";
    var authorizers = await app.model.Authorizer.findAll({
        fields: ['aid']
    });

    var issue = await app.model.Issue.findOne({
        condition: {
            pid: pid
        }
    });

    if(issue.iid)
    
})