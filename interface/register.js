var util = require("../utils/util.js");
var config = require("../config.json");
var SwaggerCall = require("../utils/SwaggerCall");
var ByteBuffer = require("bytebuffer");
var mail = require("../utils/sendmail");
var api = require("../utils/api");
var SuperDappCall = require("../utils/SuperDappCall")
var TokenCall = require("../utils/TokenCall");
var mailer = require("../utils/mailTemplate/TemplateMail/index");
var registrationMail = require("../utils/mailTemplate/TemplateMail/register");
var addressquery = require("../utils/mailTemplate/TemplateMail/addressquery");
var register = require("../interface/register");
var registrations = require("../interface/registrations");
var auth = require("../interface/authController");

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


//start
app.route.post('/payslip/pendingIssues', async function(req, cb){  // High intensive call, need to find an alternative
    var result = await app.model.Employee.findAll({});
    var array = []; 
    for(obj in result){
        var options = {
            empid: result[obj].empID,
            month: req.query.month,
            year: req.query.year,
        }
        let response = await app.model.Payslip.findOne({condition: options,fields:['pid']});
        if(!response){
             array.push(result[obj]);
        }
        // else{
        //     let rejresponse = await app.model.Reject.findOne({condition:{pid:response.pid}})
        //     if(rejresponse){
        //         array.push(result[obj]);
        //     }
        // }
    }
    return array;
})

//On issuer dashboard to display confirmed payslips which are confirmed by all authorizers 
//GET call
//inputs:month and year
//outpu: pays array which contains the confirmed payslips.
app.route.post('/payslip/confirmedIssues',async function(req,cb){
    var pays=[]
    var auths = await app.model.Authorizer.findAll({fields:['aid']});
    var count_of_auths = auths.length;
    var options = {
        status : 'pending',
        count : {$gte : count_of_auths }
    }
    var pids = await app.model.Issue.findAll({condition: options,fields:['pid']});
    for(pid in pids){
            var count = 0;
            for(auth in auths){
                let response = await app.model.Cs.exists({pid:pid,aid:auth})
                if(response){
                    count+=1;
                }
            }
            if(count === count_of_auths){
                pays.push(await app.model.Payslip.findOne({pid:pid}));
            }
            else{
                app.sdb.update("issue",{count:count},{pid:pid})
            }
    }
    return pays;
})

app.route.post('/payslip/initialIssue',async function(req,cb){
     var payslip={
        toaddr:req.query.toaddr,
        pid:req.query.pid,
        email:req.query.email,
        empid:req.query.empid,
        name:req.query.name,
        employer:req.query.employer,
        month:req.query.month,
        year:req.query.year,
        designation:req.query.designation,
        bank:req.query.bank,
        accountNumber:req.query.accountNumber,
        pan:req.query.pan,
        basicPay:req.query.basicPay,
        hra:req.query.hra,
        lta:req.query.lta,
        ma:req.query.ma,
        providentFund:req.query.providentFund,
        professionalTax:req.query.professionalTax,
        grossSalary:req.query.grossSalary,
        totalDeductions:req.query.totalDeductions,
        netSalary:req.query.netSalary,
        timestamp: new Date().getTime().toString() 
     };
     issuerid=req.query.issuerid;
     secret=req.query.secret;
     var publickey = util.getPublicKey(secret);
     var checkissuer = await app.model.Issuer.findOne({
         condition:{
             id: req.query.issuerid  
         }
     });
     if(!checkissuer) return "Invalid Issuer";

     if(checkissuer.publickey === '-'){
         app.sdb.update('issuer', {publickey: publickey}, {iid:issuerid});
     }
     // Check Employee
     var check = await app.model.Employee.exists({
        email: payslip.email
    })
    if(!check) return "Invalid Employee";
    
    // Check Payslip already issued
    var options = {
        condition: {
            empid: payslip.empid,
            employer: payslip.employer,
            month: payslip.month,
            year: payslip.year
        }
    }
    var result = await app.model.Payslip.findOne(options);
    if(result){
        return 'Payslip already issued';
    }
    app.sdb.create("payslip", payslip);
    var hash = util.getHash(JSON.stringify(payslip));
    var sign = util.getSignatureByHash(hash, secret);
    var base64hash = hash.toString('base64');
    var base64sign = sign.toString('base64');
    app.sdb.create("issue", {
        pid:payslip.pid,
        iid:issuerid,
        hash: base64hash,
        sign: base64sign,
        publickey:publickey,
        timestamp:payslip.timestamp,
        status:"pending",
        count : 0
    });
});
app.route.post('/authorizers/pendingSigns',async function(req,cb){
        var pids = await app.model.Issue.findall({condition:{status:"pending"},fields:['pid']})
        var remaining = [];
        var aid = req.query.aid;
        for(pid in pids){
            let response = await app.model.Cs.exists({condition:{pid:pid, aid:aid}});
            if(!response){
                remaining.push(await app.model.Payslip.findOne({pid:pid},{fields:[email,pid]}))
            }
        }
        return remaining;
});


app.route.post("/authorizers/Verification",async function(req,cb){
    var pid = req.query.pid;
 
    var response=await app.model.Payslip.findOne({condition:{pid:pid}});
    return response;
})

app.route.post('/authorizer/authorize',async function(req,cb){
    var secret = req.query.secret
    var iid = req.query.iid
    var authid = req.query.authid
    var dappid = req.query.dappid
    var pid=req.query.pid
    app.sdb.lock("authorize@" +iid);
        // Check Authorizer
        var publickey = util.getPublicKey(secret);
        var checkauth = await app.model.Authorizer.findOne({
            condition:{
                aid: authid
            }
        });
        if(!checkauth) return "Invalid Authorizer";

        if(checkauth.publickey === '-'){
            app.sdb.update('authorizer', {publickey: publickey}, {id: authid});
        }
        var check = await app.model.Cs.findOne({
            condition: {
                upid: iid,
                aid: authid
            }
        });
        if(check) return "Already authorized";
        var payslip = await app.model.Payslip.findOne({
            condition: {
                pid:pid
            }
        });
        var hash = util.getHash(JSON.stringify(payslip));
        var base64hash = hash.toString('base64');
        if(uissue.hash !== base64hash) return "Invalid Issuer";
        var base64sign = (util.getSignatureByHash(hash, secret)).toString('base64');
        app.sdb.create('cs', {
            iid:iid,
            pid:pid,
            aid:aid,
            sign: base64sign
        });
        return "success";
})

app.route.post('/authorizer/reject',async function(req,cb){
    var pid = req.query.pid;
    var message = req.query.message;
    //mail code is written here
    app.sdb.del('Issue',{pid:pid});
    app.adb.del('Payslip',{pid:pid});
})
