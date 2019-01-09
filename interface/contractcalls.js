var DappCall = require("../utils/DappCall");
var mailCall = require("../utils/mailCall");
var logger = require("../utils/logger");
var locker = require("../utils/locker");



app.route.post("/issueTransactionCall", async function(req, res){
    await locker("issueTransactionCall");
    logger.info("Entered /issueTransactionCall API");
    var transactionParams = {};
    var pid = req.query.pid;
    var payslip = await app.model.Payslip.findOne({
        condition: {
            pid: pid
        }
    });

    if(!payslip) return {
        message: "Invalid Payslip",
        isSuccess: false
    }
    var authorizers = await app.model.Authorizer.findAll({
        fields: ['aid']
    });

    var issue = await app.model.Issue.findOne({
        condition: {
            pid: pid
        }
    });

    if(issue.status === 'issued') return {
        message: "Payslip already issued",
        isSuccess: false
    }

    if(issue.iid !== req.query.iid) return {
        message: "Invalid issuer",
        isSuccess: false
    }
    
    var employee = await app.model.Employee.findOne({
        condition: {
            empID: payslip.empid
        }
    });
    if(!employee) return {
        message: "Invalid employee",
        isSuccess: false
    }
    
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
            payslip: payslip
        }
    }

    mailCall.call("POST", "", mailBody, 0);

    return response;
})