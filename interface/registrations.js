var schema = require('../schema/accounts.js');
var httpCall = require('../utils/httpCall.js');
var constants = require('../utils/constants.js');
var addressHelper = require('../utils/address.js');
var z_schema = require('../utils/zschema-express.js');
var BKVSCall = require('../utils/BKVSCall.js');
var SuperDappCall = require("../utils/SuperDappCall");
var DappCall = require("../utils/DappCall");
var SwaggerCall = require('../utils/SwaggerCall.js');
var request = require('request');
var auth = require('./authController');
var UploadCall = require('../utils/UploadCall');
var logger = require("../utils/logger");



// // Return Payslip with empname
// app.route.get('/payslip/:empname',  async function (req) {
//     let result = await app.model.Payslip.findOne({
//         condition: { empname: req.params.empname }
//     })
//     return result
//   })

module.exports.exists = async function(req, cb){

    var param = {
        email: req.query.email
    }

    // if(!req.query.dappToken) return "Need Dapp Token, please Login";
    // if(! (await auth.checkSession(req.query.dappToken))) return "Unauthorized Token";

    var response = await SwaggerCall.call('GET', '/api/v1/user/exist?email=' + param.email, param);
    return response;
    
}

app.route.post('/user/exist', module.exports.exists);

//BKVS login
app.route.post('/userlogin', async function (req, cb) {
    var ac_params = {
        email: req.query.email,
        password: req.query.password
    };

    app.sdb.lock('payroll.userlogin@'+req.query.email);


    var response = await BKVSCall.call('POST', `/api/v1/login`, ac_params);// Call: http://54.254.174.74:8080

    // if (response.isSuccess === true){
    //     var user = await app.model.Employer.findOne({
    //         condition:{
    //             email: req.query.email
    //         }
    //     });

    //     if(!user) return "-2" // User not registered in Dapp

    //     var tokenSearch = await app.model.Session.exists({
    //         email: user.email
    //     });

    //     var token = auth.getJwt(user.email);

    //     if(tokenSearch) {
    //         app.sdb.update('session', {jwtToken: token}, {email: user.email});
    //     }
    //     else{
    //         app.sdb.create('session', {
    //             email: user.email,
    //             jwtToken: token
    //         })
    //     }

    //     response.dappToken = token;
    // }
    
    return response;

 });
 
 module.exports.signup = async function (req, cb) {
    var params={
        countryId:req.query.countryId,
        countryCode:req.query.countryCode,
        email:req.query.email,
        name:req.query.name,
        password:req.query.password,
        type:req.query.type
    }

    app.sdb.lock('payroll.usersignup@'+req.query.email);

    var response = await BKVSCall.call('POST', `/api/v1/signup`, params);// Call: http://54.254.174.74:8080
    // if(response.isSuccess===true || response.status === "CONFLICT")

    if(response.isSuccess===true)
    {
        // var user = await app.model.Employer.exists({
        //     email: req.query.emailid
        // });

        // if(user) return "-1"; // User already registered

        // app.sdb.create('employer', {
        //     name: req.query.name,
        //     email: req.query.emailid
        // });

        return "success";
    }
    else
    {
        return response;
    }

 }
 //BKVS Signup
 app.route.post('/usersignup', module.exports.signup);

 app.route.post('/registerEmployeeToken', async function(req, cb){
     var options = {
         condition: {
             token: req.query.token
         }
     }
     console.log("token: " + options.condition.token);
     var result = await app.model.Pendingemp.findOne(options);

     if(!result) return "Invalid token";

     var mapEntryObj = {
        address: req.query.walletAddress,
        dappid: req.query.dappid
    }
    var mapcall = await SuperDappCall.call('POST', '/mapAddress', mapEntryObj);

     delete result.token;

     result.walletAddress = req.query.walletAddress;

     app.sdb.create("employee", result);

     app.sdb.del('pendingemp', {empID: result.empID});
     return "success";
 });

 app.route.post('/getPayslips', async function(req, cb){
    var address = req.query.address;
    var options = {};
    var response = await DappCall.call('GET', '', options, req.query.dappid);
    if(!response) return "No response";
    var transactionsArray = response.transactions;
    console.log(transactionsArray);
    var result = [];
    function parseAddress(str){
        var array = str.split(",");
        var arr = array[0].split("\"");
        var ar = array[1].split("\"");
        var address = arr[1];
        var id = ar[1];
        console.log("Parsed address: " + address);
        console.log("Parsed id: " + id);
        return {
            address: address,
            id: id
        };
    }
    for(i in transactionsArray){
        var obj = parseAddress(transactionsArray[i].args);
        console.log("The parsed object" + JSON.stringify(obj));
        if(address === obj.address){
            transactionsArray[i].certType = "paylsip";
            result.push(transactionsArray[i]);
        }
    }
    return result;
});

app.route.post('/payslips/employee/issued', async function(req, cb){
    var employee = await app.model.Employee.findOne({
        condition: {
            walletAddress: req.query.walletAddress
        }, 
        fields: ['empID']
    });
    if(!employee) return {
        message: "Address not associated with any employee",
        isSuccess: false
    }

    var result = await app.model.Issue.findAll({
        condition: {
            empid: employee.empID,
            status: 'issued'
        },
        limit: req.query.limit,
        offset: req.query.offset
    });

    return {
        issuedPayslips: result,
        isSuccess: true
    }

})
