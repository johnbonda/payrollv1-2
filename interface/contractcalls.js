var ByteBuffer = require("bytebuffer");
var util = require("../utils/util.js");
var api = require("../utils/api");
var SwaggerCall = require("../utils/SwaggerCall");
var SuperDappCall = require("../utils/SuperDappCall")
var TokenCall = require("../utils/TokenCall");
var register = require("../interface/register");
var registrations = require("../interface/registrations");
var auth = require("../interface/authController");
var DappCall = require("../utils/DappCall");
var mailCall = require("../utils/mailCall");


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
    if(issue.iid !== req.query.iid) return "Invalid issuer";
    
    var employee = await app.model.Employee.findOne({
        condition: {
            empID: payslip.empid
        }
    });
    if(!employee) return "Invalid employee";
    
    // if(issue.status !== "authorized") return "Payslip not authorized yet";

    var args = "[\"" + employee.walletAddress + "\"," + "\"payslip\"";
    for(i in payslip){
        args += ",\"" + payslip[i] + "\"";
    }
    args += "]";

    transactionParams.args = args;
    transactionParams.type = 1003;
    transactionParams.fee = req.query.fee;
    transactionParams.secret = req.query.secret;
    transactionParams.senderPublicKey = req.query.senderPublicKey;

    console.log(JSON.stringify(transactionParams));

    var response = await DappCall.call('PUT', "/unsigned", transactionParams, req.query.dappid,0);
    if(response.success){
        app.sdb.update('issue', {status: "issued"}, {pid: pid});  
        app.sdb.update('issue', {timestampp: new Date().getTime()}, {pid: pid});  
    }

    var mailBody = {
        mailType: "sendIssued",
        mailOptions: {
            to: [employee.email],
            name: employee.name,
            month: payslip.month,
            year: payslip.year
        }
    }

    mailCall.call("POST", "", mailBody, 0);

    return response;
})