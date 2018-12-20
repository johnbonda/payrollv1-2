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

async function verifyPayslip(req, cb){
    var hash = util.getHash(req.query.data);
    var base64hash = hash.toString('base64');

    console.log("Verify payslip string: " + req.query.data);
    console.log("Verify payslip hash: " + base64hash);

    var result = await app.model.Issue.findOne({
        condition: {hash: base64hash}
    });
    if(!result) return {
        message: "Hash not found",
        isSuccess: false
    }

    var sign = new Buffer(result.sign, 'base64');

    var issuer = await app.model.Issuer.findOne({
        condition: {
            iid: result.iid
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

    if(result.status !== "issued") return {
        message: "Payslip not yet issued or authorized",
        isSuccess: false
    }

    var signatures = await app.model.Cs.findAll({
        condition: {
            pid: result.pid
        }
    });

    for(i in signatures){
        let authorizer = await app.model.Authorizer.findOne({
            condition: {
                aid: signatures[i].aid
            }
        });
        if(!authorizer) {
            authorizer = {
                aid: "Delected Authorizer"
            }
        }
        if(!util.Verify(hash, new Buffer(signatures[i].sign, 'base64'), new Buffer(signatures[i].publickey, 'hex'))) return {
            message: "Wrong Authorizer signature of Authorizer ID: " + authorizer.aid,
            isSuccess: false
        }
    }

    // var authsigns = await app.model.Authsign.findAll({
    //     condition: {
    //         mid: result.id
    //     }
    // });

    // var authsignsArray = ['-1'];
    // for(i in authsigns){
    //     authsignsArray.push(authsigns[i].aid);
    // }

    // var authorizers = await app.model.Authorizer.findAll({
    //     condition:{
    //         id: {
    //             $in: authsignsArray
    //         }
    //     }
    // });

    // var publickeydictionary = {};
    // for(x in authorizers){
    //     publickeydictionary[authorizers[x].id] = authorizers[x].publickey;
    // }
    // for(i in authsigns){
    //     if(!util.Verify(hash, new Buffer(authsigns[i].sign, 'base64'), new Buffer(publickeydictionary[authsigns[i].aid], 'hex'))) return {
    //         message:"Wrong Signature of Authorizer ID: " + authsigns[i].aid,
    //         isSuccess: false
    //     }
    // }

    result.issuedBy = issuer.email;
    result.isSuccess = true;
    return result;

}

app.route.post("/payslips/verify", verifyPayslip);

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
        count : {$gte : count_of_auths },
        iid: req.query.iid
    }
    var pids = await app.model.Issue.findAll({condition: options,fields:['pid']});
    for(pid in pids){
            var count = 0;
            for(auth in auths){
                let response = await app.model.Cs.exists({pid:pids[pid].pid,aid:auths[auth].aid})
                if(response){
                    count+=1;
                }
            }
            if(count === count_of_auths){
                pays.push(await app.model.Payslip.findOne({condition: {pid:pids[pid].pid}}));
            }
            else{
                app.sdb.update("issue",{count:count},{pid:pids[pid].pid})
            }
    }
    return pays;
})

app.route.post('/payslip/initialIssue',async function(req,cb){
    app.sdb.lock("Initiate");
    var count = await app.model.Count.findOne({
       condition:{id:0}, fields:['pid']
    });
    var timestamp = new Date().getTime();
     var payslip={
        pid:String(count.pid + 1),
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
        timestamp: timestamp.toString()
     };
     issuerid=req.query.issuerid;
     secret=req.query.secret;
     var publickey = util.getPublicKey(secret);
     var checkissuer = await app.model.Issuer.findOne({
         condition:{
             iid: req.query.issuerid  
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

    var check = await app.model.Payslip.exists({
        pid: payslip.pid
    });
    if(check) return "Duplicate pid";
    console.log("Generated Payslip: " + JSON.stringify(payslip));
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
        timestampp:timestamp.toString(),
        status:"pending",
        count : 0
    });
    app.sdb.update('count',{pid:count.pid+1}, {id:0});
});

app.route.post('/authorizers/pendingSigns',async function(req,cb){
        var checkAuth = await app.model.Authorizer.exists({
            aid: req.query.aid
        })
        if(!checkAuth) return "Invalid Authorizer";

        var pids = await app.model.Issue.findAll({condition:{status:"pending"}})
        var remaining = [];
        var aid = req.query.aid;
        for(p in pids){
            let response = await app.model.Cs.exists({pid:pids[p].pid, aid:aid});
            if(!response){
                // Sending email in response too
                var payslip = await app.model.Payslip.findOne({
                    condition: {
                        pid: pids[p].pid
                    }
                });
                pids[p].email = payslip.email;
                
                remaining.push(pids[p]);
            }
        }
        return remaining;
});

app.route.post('/payslip/getPayslip', async function(req, cb){
    var payslip = await app.model.Payslip.findOne({
        condition: {
            pid: req.query.pid
        }
    });
    return payslip;
})

app.route.post('/authorizer/authorize',async function(req,cb){
    var secret = req.query.secret;
    var authid = req.query.aid;
    var pid=req.query.pid;
    app.sdb.lock("authorize@" +authid + pid);
        // Check Authorizer
        var publickey = util.getPublicKey(secret);
        var checkauth = await app.model.Authorizer.findOne({
            condition:{
                aid: authid
            }
        });
        if(!checkauth) return {
            message: "Invalid Authorizer",
            isSuccess: false
        }

        var issue = await app.model.Issue.findOne({
            condition: {
                pid: pid
            }
        });
        if(!issue) return {
            message: "Invalid issue",
            isSuccess: false
        }

        if(issue.status !== "pending") return {
            message: "Payslip not pending",
            isSuccess: false
        }

        if(checkauth.publickey === '-'){
            app.sdb.update('authorizer', {publickey: publickey}, {aid: authid});
        }
        var check = await app.model.Cs.findOne({
            condition: {
                pid: pid,
                aid: authid
            }
        });
        if(check) return {
            message: "Already authorized",
            isSuccess: false
        }
        var payslip = await app.model.Payslip.findOne({
            condition: {
                pid:pid
            }
        });

        var issuer = await app.model.Issuer.findOne({
            condition: {
                iid: issue.iid
            }
        });
        if(!issuer) return {
            message: "Invalid issuer",
            isSuccess: false
        }

        console.log("Queried Payslip: " + JSON.stringify(payslip));

        var hash = util.getHash(JSON.stringify(payslip));
        var base64hash = hash.toString('base64');
        console.log("issue.hash: " + issue.hash);
        console.log("base64hash: " + base64hash);
        if(issue.hash !== base64hash) return {
            message: "Hash doesn't match",
            isSuccess: false
        }
        var base64sign = (util.getSignatureByHash(hash, secret)).toString('base64');
        app.sdb.create('cs', {
            pid:pid,
            aid:authid,
            sign: base64sign,
            publickey: publickey
        });
        var count = issue.count + 1;
        app.sdb.update('issue', {count: count}, {pid: issue.pid});
        return {
            message: "Successfully Authorized",
            isSuccess: true
        };
})

app.route.post('/authorizer/reject',async function(req,cb){
    var payslip = await app.model.Payslip.findOne({
        condition: {
            pid: req.query.pid
        }
    });
    if(!payslip) return "Invalid payslip";

    var authorizer = await app.model.Authorizer.findOne({
        condition: {
            aid: req.query.aid
        }
    });
    if(!authorizer) return "Invalid Authorizer";

    var pid = req.query.pid;
    var message = req.query.message;
    //mail code is written here 
    app.sdb.del('Issue',{pid:pid});
    app.adb.del('Payslip',{pid:pid});

    var mailBody = {
        mailType: "sendRejected",
        mailOptions: {
            to: [employee.email],
            authorizerEmail: authorizer.email, 
            message: message,
            payslip: payslip
        }
    }

    mailCall.call("POST", "", mailBody, 0);
})

app.route.post("/sharePayslips", async function(req, cb){
    var employee = await app.model.Employee.findOne({
        condition: {
            empID: req.query.empID
        }
    });
    var mailBody = {
        mailType: "sendShared",
        mailOptions: {
            to: [req.query.email],
            name: employee.name,
            pids: req.query.pids,
            dappid: req.query.dappid
        }
    }

    mailCall.call("POST", "", mailBody, 0);
})

app.route.post("/registerEmployee", async function(req, cb){
    app.sdb.lock("registerEmployee");
    
    var count = await app.model.Count.findOne({
        condition:{id:0}, fields:['empid']
     });

    var countryCode = req.query.countryCode;
    var email = req.query.email;
    var lastName = req.query.lastName;
    var name = req.query.name;
    var uuid = count.empid + 1;
    var designation = req.query.designation;
    var bank = req.query.bank;
    var accountNumber = req.query.accountNumber;
    var pan = req.query.pan;
    var salary = req.query.salary;
    var dappid = req.query.dappid;
    var token = req.query.token;
    var groupName = req.query.groupName;
        var result = await app.model.Employee.exists({
            email: email
        });
        if(result) return "Employee already registered";

        // Checking if the employee's registration is pending
        result = await app.model.Pendingemp.exists({
            email:email
        });
        if(result) return "Employee didn't share his Wallet Address yet";

        var request = {
            query: {
                email: email
            }
        }
        var response = await registrations.exists(request, 0);
        

        if(response.isSuccess == false) {
            token = await register.getToken(0,0);

            console.log(token);

            if(token === "0" || token ==="-1") return "Error in retrieving token";

            function makePassword() {
                var text = "";
                var caps = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
                var smalls = "abcdefghijklmnopqrstuvwxyz";
                var symbols = "!@#$%^&*";
                var numbers = "1234567890";
            
                for (var i = 0; i < 3; i++){
                text += caps.charAt(Math.floor(Math.random() * caps.length));
                text += smalls.charAt(Math.floor(Math.random() * smalls.length));
                text += symbols.charAt(Math.floor(Math.random() * symbols.length));
                text += numbers.charAt(Math.floor(Math.random() * numbers.length));
                }
                return text;
            }

            var password = makePassword();        


            var options = {
                countryCode: countryCode,
                email: email,
                groupName: groupName,
                lastName: lastName,
                name: name,
                password: password,
                type: 'user'
            }

            console.log("About to call registration call with parameters: " + JSON.stringify(options));

            var response = await TokenCall.call('POST', '/api/v1/merchant/user/register', options, token);

            if(!response) return {
                message: "No response from register call",
                isSuccess: false
            }
            if(!response.isSuccess) return {
                message: JSON.stringify(response),
                isSuccess: false
            }
            console.log("Registration response is complete with response: " + JSON.stringify(response));
            var wallet = response.data;

            var creat = {
                email: email,
                empID: uuid,
                name: name + lastName,
                designation: designation,
                bank: bank,
                accountNumber: accountNumber,
                pan: pan,
                salary: salary,
                walletAddress: wallet.walletAddress
            }

            console.log("About to make a row");

            app.sdb.create('employee', creat);

            var mapEntryObj = {
                address: wallet.walletAddress,
                dappid: dappid
            }
            var mapcall = await SuperDappCall.call('POST', '/mapAddress', mapEntryObj);
            console.log(JSON.stringify(mapcall));

            var mailBody = {
                mailType: "sendRegistered",
                mailOptions: {
                    to: [creat.email],
                    empname: creat.name,
                    wallet: wallet
                }
            }
            mailCall.call("POST", "", mailBody, 0);

            app.sdb.update("count", {empid: count.empid + 1}, {id: 0});

            return {
                message: "Registered",
                isSuccess: true
            }

        }
            
        else{
            var jwtToken = auth.getJwt(email);  
            var crea = {
                email: email,
                empID: uuid,
                name: name + lastName,
                designation: designation,
                bank: bank,
                accountNumber: accountNumber,
                pan: pan,
                salary: salary,
                token: jwtToken
            }
            app.sdb.create("pendingemp", crea);
            console.log("Asking address");

            var mailBody = {
                mailType: "sendAddressQuery",
                mailOptions: {
                    to: [crea.email],
                    token: jwtToken,
                    dappid: dappid
                }
            }
            mailCall.call("POST", "", mailBody, 0);

            app.sdb.update("count", {empid: count.empid + 1}, {id: 0});

            return {
                message: "Awaiting wallet address",
                isSuccess: true
            }
        }
})

app.route.post("/payslips/verifyMultiple", async function(req, cb){
    var pids = req.query.pids;
    var result = {};

    for(pid in pids){
        var payslip = await app.model.Payslip.findOne({
            condition: {
                pid: pids[pid]
            }
        });
        var req = {
            query: {
                data: JSON.stringify(payslip)
            }
        }
        var verificationResult = await verifyPayslip(req, 0);
        verificationResult.jsonPayslip = JSON.stringify(payslip);
        result[pids[pid]] = verificationResult;
    }
    return result;
});

app.route.post("/payslip/month/status", async function(req, cb){
    var month = req.query.month;
    var year = req.query.year;
    var resultArray = {};
    var employees = await app.model.Employee.findAll({
        fields: ['empID', 'name', 'designation']
    });
    for(i in employees){
        var initiated = await app.model.Payslip.findOne({
            condition:{
                empid: employees[i].empID,
                month: month,
                year: year
            }
        });
        if(!initiated){
            resultArray[employees[i].empID] = {
                name: employees[i].name,
                designation: employees[i].designation,
                status: "Pending"
            }
            continue;
        }

        var issue = await app.model.Issue.findOne({
            condition: {
                pid: initiated.pid
            }
        });
        if(issue.status === "issued"){
            resultArray[employees[i].empID] = {
                name: employees[i].name,
                designation: employees[i].designation,
                status: "Issued"
            }
            continue;
        }
        
        var auths = await app.model.Authorizer.findAll({fields:['aid']});
        var count_of_auths = auths.length;

        if(issue.count >= count_of_auths){
            var count = 0;
            for (auth in auths){
                let response = await app.model.Cs.exists({
                    pid: issue.pid,
                    aid: auths[auth].aid
                });
                if(response){
                    count += 1;
                }
            }
            if(count === count_of_auths){
                resultArray[employees[i].empID] = {
                    name: employees[i].name,
                    designation: employees[i].designation,
                    status: "Authorized"
                }
                continue;
            }
        }
        
        resultArray[employees[i].empID] = {
            name: employees[i].name,
            designation: employees[i].designation,
            status: "Initiated"
        }
    }
    return resultArray;
});

app.route.post('/payslips/sentForAuthorization', async function(req, cb){
    var count = await app.model.Issue.count({
        status: 'pending'
    });
    return {
        count: count,
        isSuccess: true
    };
})

