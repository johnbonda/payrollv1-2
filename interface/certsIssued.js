var logger = require("../utils/logger");

app.route.post('/totalCertsIssued', async function(req, cb)
{ 
    logger.info("Entered /totalCertsIssued API");
    var totalCerts = await app.model.Issue.count({status:"issued"});
    return {
        totalCertificates: totalCerts,
        isSuccess: true
    };
});

app.route.post('/totalEmployee', async function(req, cb)
{ 
    logger.info("Entered /totalEmployee API");
   var totalemp= await app.model.Employee.count({});
    return {
         totalEmployee: totalemp,
         isSuccess: true
        };
});

//- get all employees name, id, designation with dappid
//Inputs: limit, offset
app.route.post('/employee/details',async function(req,cb){
    logger.info("Entered /employee/details");
var res=await app.model.Employee.findAll({
    fields:['empID','name','designation'],
    limit: req.query.limit,
    offset: req.query.offset,
})
return res;
});


// Inputs: limit
app.route.post('/recentIssued', async function(req, cb)
{ 
    //var num = await app.model.Issue.count({status:"issued"});
    logger.info("Entered /recentIssued API");
    var res= await app.model.Issue.findAll({
        condition:{
            status:"issued"
        },
        fields:['pid', 'timestampp'], 
        sort: {
            timestampp: -1
        },
        limit: req.query.limit
    });
    for (i in res){
        var payslip=await app.model.Payslip.findOne({
            condition:{
                pid:res[i].pid
            }
        });
        res[i].name=payslip.name;
        res[i].empid=payslip.empid;
    } 
  return res;
});


// Inputs: limit, offset
app.route.post('/getEmployees', async function(req, cb)
{ 
    logger.info("Entered /getEmployees API");
    var total = await app.model.Employee.count({});
    var employees = await app.model.Employee.findAll({
        limit: req.query.limit,
        offset: req.query.offset
    });
    return {
        total: total,
        employees: employees
    }
})

app.route.post('/getEmployeeById', async function(req, cb)
{ 
    logger.info("Entered /getEmployeeById API");
    return await app.model.Employee.findOne( {condition : { empID : req.query.id }} );
})

app.route.post('/sortTesting', async function(req, cb){
    logger.error("Entered /sortTesting API - Someone is calling this API");
    var result = await app.model.Authorizer.findAll({
        condition: {
            publickey: "-"
        },
        sort: {
            aid: -1
        },
        fields: ['aid'],
        limit: 6
    });
    return result;
})

app.route.post('/getPendingAuthorizationCount', async function(req, cb){
    logger.info("Entered /getPendingAuthorizationCount API");
    var authCount = await app.model.Authorizer.count({});
    var result = await app.model.Issue.count({
        status: "pending",
        count: {
            $lt: authCount
        }
    });
    return {
        totalUnauthorizedCertificates: result,
        isSuccess: true
    }
});

app.route.post('/employee/id/exists', async function(req, cb){
    logger.info("Entered /employee/id/exists API");
    var exists = false;
    exists = await app.model.Employee.exists({
        empID: req.query.empid
    });
    return {
        isSuccess: exists
    };
})