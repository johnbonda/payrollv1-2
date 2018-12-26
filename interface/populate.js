var ByteBuffer = require("bytebuffer");
var util = require("../utils/util.js");
var config = require("../config.json");
var SwaggerCall = require("../utils/SwaggerCall");
var ByteBuffer = require("bytebuffer");
var api = require("../utils/api");
var SuperDappCall = require("../utils/SuperDappCall")
var TokenCall = require("../utils/TokenCall");
var register = require("../interface/register");
var registrations = require("../interface/registrations");
var auth = require("../interface/authController");
var mailCall = require("../utils/mailCall");
var SwaggerCall = require("../utils/SwaggerCall");
var DappCall = require("../utils/DappCall");
var logger = require("../utils/logger");



app.route.post('/generateEmployees', async function(req, cb){
    var count = await app.model.Count.findOne({
        condition: {
            id: 0
        }
    });

    for(var i = count.empid+1; i <= count.empid+req.query.count; i++){
        var creat = {
            email: "PEEmail" + i + "@yopmail.com",
            empID: i,
            name: "PEName" + i,
            designation: "PEmplDesignation" + i,
            bank: "PEBank" + i,
            accountNumber: "PEAccountNumber" + i,
            pan: "PEPan" + i,
            salary: "PESalary" + i,
            walletAddress: "PEAddress" + i
        }

        console.log("About to make a row");
        app.logger.log("LOLOLOLOLLLOOLOLOLOLOLOLOL");

        app.sdb.create('employee', creat);

        var mapEntryObj = {
            address: "PEAddress" + i,
            dappid: req.query.dappid
        }
        var mapcall = await SuperDappCall.call('POST', '/mapAddress', mapEntryObj);
        app.sdb.update('count', {empid: count.empid + req.query.count}, {id: 0});
    }
});

app.route.post('/generateAndIssuePayslips', async function(req, cb){
    var employees = await app.model.Employee.findAll({});
    for ( i in employees){
        console.log("employee mail is: " + employees[i].email);
        for(var j = 1; j <= 12; j++){
            var payslip = {
                pid: "PPId" + (i+1)*j,
                email: employees[i].email,
                empid: employees[i].empID,
                name: employees[i].name,
                employer: "PPEmployer",
                month: "PPMonth" + j,
                year: "PPYear",
                designation: employees[i].designation,
                bank: employees[i].bank,
                accountNumber: employees[i].accountNumber,
                pan: employees[i].pan,
                basicPay: "PPBasicPay" + i,
                hra: "PPHra" + i,
                lta: "PPLta" + i,
                ma: "PPMa" + i,
                providentFund: "PPProvidentFund" + i,
                professionalTax: "PPProfessionalTax" + i,
                grossSalary: "PPGrossSalary" + i,
                totalDeductions: "PPTotalDeductions" + i,
                netSalary: "PPNetSalary" + i,
                timestamp: new Date().getTime().toString()
            };
            app.sdb.create('payslip', payslip);

            app.sdb.create('issue', {
                pid: payslip.pid,
                iid: 1,
                hash: "PPHash" + i,
                sign: "PPSign" + i,
                publickey: "-",
                timestampp: new Date().getTime().toString(),
                status: "issued",
                count: 10,
                empid: employees[i].empID,
                transactionId: '-'
            });

            var args = "[\"" + employees[i].walletAddress + "\"," + "\"payslip\"";
            for(k in payslip){
                args += ",\"" + payslip[k] + "\"";
            }
            args += "]";

            var transactionParams = {};
            transactionParams.args = args;
            transactionParams.type = 1003;
            transactionParams.fee = req.query.fee;
            transactionParams.secret = req.query.secret;
            transactionParams.senderPublicKey = req.query.senderPublicKey;

            //console.log(JSON.stringify(transactionParams));

            var response = await DappCall.call('PUT', "/unsigned", transactionParams, req.query.dappid,0);
            console.log("Result is: " + JSON.stringify(response));
        }
    }
})
