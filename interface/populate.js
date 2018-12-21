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


app.route.post('/generateEmployees', async function(req, cb){
    for(var i = 1; i <= 10; i++){
        var creat = {
            email: "payrollEmployee" + i + "@yopmail.com",
            empID: i,
            name: "payrollEmployeeName" + i,
            designation: "payrollEmployeeDesignation" + i,
            bank: "payrollEmployeeBank" + i,
            accountNumber: "payrollAccountNumber" + i,
            pan: "payrollPan" + i,
            salary: "payrollSalary" + i,
            walletAddress: "payrollAddress" + i
        }

        console.log("About to make a row");

        app.sdb.create('employee', creat);

        var mapEntryObj = {
            address: "payrollAddress" + i,
            dappid: dappid
        }
        var mapcall = await SuperDappCall.call('POST', '/mapAddress', mapEntryObj);
        console.log(JSON.stringify(mapcall));
    }
});
