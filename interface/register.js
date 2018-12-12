var util = require("../utils/util.js");
var config = require("../config.json");
var SwaggerCall = require("../utils/SwaggerCall");

// returns payslip if exists, takes parameters empid, month , year
app.route.post('/payslip/issuedOrNot', async function(req, cb){ 
    var obj = {
        empid: req.query.empid,
        month: req.query.month,
        year: req.query.year
    }

    // if(!req.query.dappToken) return "Need Dapp Token, please Login";
    // if(! (await auth.checkSession(req.query.dappToken))) return "Unauthorized Token";

    console.log("The query is: " + JSON.stringify(obj));


    var result = await app.model.Payslip.exists(obj);

    console.log("The result is: " + result);

    if(result) return "true";
    return "false";
})

app.route.post('/payslip/pendingIssues', async function(req, cb){  // High intensive call, need to find an alternative

    // if(!req.query.dappToken) return "Need Dapp Token, please Login";
    // if(! (await auth.checkSession(req.query.dappToken))) return "Unauthorized Token";
   
    var result = await app.model.Employee.findAll(options);


    var array = [];

    for(obj in result){
        var options = {
            empid: result[obj].empID,
            month: req.query.month,
            year: req.query.year,
        }
        let response = await app.model.Ucps.exists(options);
        //if(!response) array.push(result[obj]);
        if(!response){
            let response2 = await app.model.Mps.exists(options);
            if(!response2) array.push(result[obj]);
        }
    }
    return array;
})

// For the employee table,
// GET call
// inputs: No inputs
// outputs: empid, name, designations
app.route.post('/employees', async function(req, cb){

    // if(!req.query.dappToken) return "Need Dapp Token, please Login";
    // if(! (await auth.checkSession(req.query.dappToken))) return "Unauthorized Token";

    var options = {
        fields: ['empID', 'name', 'designation']
    }

    var result = await app.model.Employee.findAll(options);

    return result;
})

// For issue auto-fill,
// GET call
// inputs: empid
// outputs: email, empid, name, designation, actualsalary
app.route.post('/employeeData', async function(req,cb){

    // if(!req.query.dappToken) return "Need Dapp Token, please Login";
    // if(! (await auth.checkSession(req.query.dappToken))) return "Unauthorized Token";

    var options = {
        condition: {
            empID: req.query.empid
        }
    }

    var result = await app.model.Employee.findOne(options);

    return result;
})

// Verifies the json string
// inputs: data (contains the stringified json object)
// outputs: verified or not
app.route.post('/verifypayslip', async function(req,cb){
        
    //app.logger.debug(objtext);
    //var obj = JSON.parse(objtext);
    //var objtext = JSON.stringify(req.params.data);
    //console.log("Recieved data: " + objtext);
    console.log("recieving: " + req.query.data);
    var hash = util.getHash(req.query.data);
    //console.log("Verifier: " + hash);
    //var hash = util.getHash(objtext);

    //mail.sendMail("john@belfricsbt.com", "From verify", objtext + "Hash from verify: " +hash);


    var base64hash = hash.toString('base64');
    //console.log("Verifier base64 hash: " + base64hash)

    var result = await app.model.Issue.findOne({
        condition: {hash: base64hash}
    });

    if(!result) return "Hash not found";

    //var result2 = await app.model.Employer.findOne({publickey: result.publickey});

    //console.log("Verifier base64 sign: " + result.sign);
    //console.log("Verifier base64 publickey: " + result.publickey);

    var sign = new Buffer(result.sign, 'base64');
    var publickey = new Buffer(result.publickey, 'hex');  
    //console.log("Verifier sign: " + sign);
    //console.log("Verifier publickey: " + publickey);


    if(!util.Verify(hash, sign, publickey) /*&& result2.name === obj.employer*/) return "Wrong Employer Signature";

    var myDate = new Date( Number(result.timestamp));
    var timestamp = myDate.toGMTString();

    var successResult = {
        signature: result.sign,
        publickey: result.publickey,
        timestamp: timestamp,
        isSuccess: true
    }
    return successResult;

})

app.route.post("/payslips/verify", async function(req, cb){
    var hash = util.getHash(req.query.data);
    var base64hash = hash.toString('base64');

    console.log("Verify payslip string: " + req.query.data);
    console.log("Verify payslip hash: " + base64hash);

    var result = await app.model.Mi.findOne({
        condition: {hash: base64hash}
    });
    if(!result) return {
        message: "Hash not found",
        isSuccess: false
    }

    var sign = new Buffer(result.sign, 'base64');

    var issuer = await app.model.Issuer.findOne({
        condition: {
            id: result.issuerid
        }
    });
    if(!issuer) return {
        message: "Invalid Issuer",
        isSuccess: false
    }

    var publickey = new Buffer(issuer.publickey, 'hex');

    if(!util.Verify(hash, sign, publickey)) return {
        message: "Wrong Issuer Signature",
        isSuccess: false
    }

    var authsigns = await app.model.Authsign.findAll({
        condition: {
            mid: result.id
        }
    });

    var authsignsArray = ['-1'];
    for(i in authsigns){
        authsignsArray.push(authsigns[i].aid);
    }

    var authorizers = await app.model.Authorizer.findAll({
        condition:{
            id: {
                $in: authsignsArray
            }
        }
    });

    var publickeydictionary = {};
    for(x in authorizers){
        publickeydictionary[authorizers[x].id] = authorizers[x].publickey;
    }
    for(i in authsigns){
        if(!util.Verify(hash, new Buffer(authsigns[i].sign, 'base64'), new Buffer(publickeydictionary[authsigns[i].aid], 'hex'))) return {
            message:"Wrong Signature of Authorizer ID: " + authsigns[i].aid,
            isSuccess: false
        }
    }

    result.issuedBy = issuer.email;
    result.isSuccess = true;
    return result;

})

module.exports.getToken = async function(req, cb){
    var options = {
        email: config.token.email,
        password: config.token.password,
        totp: config.token.totp
    }

    var response = await SwaggerCall.call('POST','/api/v1/login', options);

    if(!response) return "-1";
    if(!response.isSuccess) return "0";

    return  response.data.token;

}

app.route.post('/getToken', module.exports.getToken)

