var DappCall = require("../utils/DappCall");
var mailCall = require("../utils/mailCall");
var logger = require("../utils/logger");
var locker = require("../utils/locker");
var blockWait = require("../utils/blockwait");
var util = require("../utils/util");
var defaultFee = require('../../../dappsConfig.json').defaultFee;
var addressUtils = require('../utils/address');




app.route.post("/issueTransactionCall", async function(req, res){
    await locker("issueTransactionCall");
    logger.info("Entered /issueTransactionCall API");
    
    //Check the package
    var limit = await app.model.Issuelimit.findOne({
        condition: {
            name: "issuelimit"
        }
    });
    if(!limit || limit.value <= 0 || limit.expirydate < new Date().getTime()) return {
        isSuccess: false,
        message: "No active package"
    }

    var transactionParams = {};
    var pid = req.query.pid;

    var issuer = await app.model.Issuer.findOne({
        condition: {
            iid: req.query.iid
        }
    });

    var payslip = await app.model.Payslip.findOne({
        condition: {
            pid: pid
        }
    });

    if(!payslip) return {
        message: "Invalid Payslip",
        isSuccess: false
    }

    var issue = await app.model.Issue.findOne({
        condition: {
            pid: pid
        }
    });

    if(issue.status === 'issued') return {
        message: "Payslip already issued",
        isSuccess: false
    }

    if(issue.status === 'pending') return {
        message: "Payslip not Authorized",
        isSuccess: false
    }

    if(issue.iid !== req.query.iid) return {
        message: "Invalid issuer",
        isSuccess: false
    }
    
    var employee = await app.model.Employee.findOne({
        condition: {
            empid: payslip.empid
        }
    });
    if(!employee) return {
        message: "Invalid employee",
        isSuccess: false
    }

    payslip.identity = JSON.parse(payslip.identity);
    payslip.earnings = JSON.parse(payslip.earnings,);
    payslip.deductions = JSON.parse(payslip.deductions);
    payslip.otherEarnings = JSON.parse(payslip.otherEarnings);
    payslip.otherDeductions = JSON.parse(payslip.otherDeductions);
    
    // if(issue.status !== "authorized") return "Payslip not authorized yet";


    var balanceCredit = await creditBalance(req.query.secret, "finalIssue");
    if(!balanceCredit.isSuccess) return balanceCredit;

    var array = [employee.walletAddress, "payslip", payslip, issue.pid, balanceCredit.ownerBalance];

    transactionParams.args = JSON.stringify(array);
    transactionParams.type = 1003;
    transactionParams.fee = balanceCredit.fee;
    transactionParams.secret = req.query.secret;
    transactionParams.senderPublicKey = req.query.senderPublicKey;

    console.log(JSON.stringify(transactionParams));

    var response = await DappCall.call('PUT', "/unsigned", transactionParams, req.query.dappid,0);

    if(!response.success){
        revertOwnerBalance(req.query.secret, "finalIssue");
        return {
            isSuccess: false,
            message: JSON.stringify(response)
        }
    }

    var mailBody = {
        mailType: "sendIssued",
        mailOptions: {
            to: [employee.email],
            payslip: payslip
        }
    }

    mailCall.call("POST", "", mailBody, 0);

    var activityMessage = issuer.email + " has issued payslip " + pid;
    app.sdb.create('activity', {
        activityMessage: activityMessage,
        pid: pid,
        timestampp: new Date().getTime(),
        atype: 'payslip'
    });

    await blockWait();
    
    return response;
})


async function creditBalance(secret, contract){
    var spenderAddress = addressUtils.generateBase58CheckAddress(util.getPublicKey(secret));
    var ownerAddress = app.custom.dappOwner;
    var contractObjects = app.custom.contractObjects;
    var currentFee = app.getFee(contractObjects[contract].type);
    if(!currentFee) currentFee = {
        min: defaultFee
    }

    var ownerBalance = await app.model.Balance.findOne({
        condition: {
            address: ownerAddress
        }
    });
    if(!ownerBalance) ownerBalance = {
        balance: '0'
    };
    if(Number(ownerBalance.balance) < Number(currentFee.min)) return {
        isSuccess: false,
        message: "Owner doesn't have enough dapp balance"
    }

    app.balances.transfer('BEL', currentFee.min, ownerAddress, spenderAddress);

    await blockWait();

    return {
        isSuccess: true,
        ownerBalance: ownerBalance.balance,
        fee: currentFee.min
    }
}

async function revertOwnerBalance(secret, contract){
    var spenderAddress = addressUtils.generateBase58CheckAddress(util.getPublicKey(secret));
    var ownerAddress = app.custom.dappOwner;
    var contractObjects = app.custom.contractObjects;
    var currentFee = app.getFee(contractObjects[contract].type);
    if(!currentFee) currentFee = {
        min: defaultFee
    }
    app.balances.transfer('BEL', currentFee.min, spenderAddress, ownerAddress);

    return {
        isSuccess: true
    }
}
