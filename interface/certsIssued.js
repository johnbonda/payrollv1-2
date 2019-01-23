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
   var totalemp= await app.model.Employee.count({
       deleted: '0'
   });
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
    condition: {
        deleted: '0'
    },
    fields:['empid','name','designation'],
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
        fields:['pid', 'timestampp', 'iid'], 
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

        var issuer = await app.model.Issuer.findOne({
            condition: {
                iid: res[i].iid
            },
            fields: ['email']
        })

        res[i].name=payslip.name;
        res[i].empid=payslip.empid;
        res[i].month = payslip.month;
        res[i].year = payslip.year;
        res[i].issuedBy = issuer.email;
    } 
  return res;
});


// Inputs: limit, offset
app.route.post('/getEmployees', async function(req, cb)
{ 
    logger.info("Entered /getEmployees API");
    var total = await app.model.Employee.count({
        deleted: '0'
    });
    var employees = await app.model.Employee.findAll({
        condition: {
            deleted: '0'
        },
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
    var employee = await app.model.Employee.findOne({
        condition : { 
            empid : req.query.id 
        }
    });
    if(!employee) return {
        message: "Employee not found",
        isSuccess: false
    }
    employee.identity = JSON.parse(Buffer.from(employee.identity, 'base64').toString());
})

app.route.post('/getPendingAuthorizationCount', async function(req, cb){
    logger.info("Entered /getPendingAuthorizationCount API");
    var result = await app.model.Issue.count({
        status: "pending",
    });
    return {
        totalUnauthorizedCertificates: result,
        isSuccess: true
    }
});

app.route.post('/employee/id/exists', async function(req, cb){
    logger.info("Entered /employee/id/exists API");
    var fields = ['empID', 'name', 'email'];
    for(i in fields){
        let condition = {};
        condition[fields[i]] = req.query.text;
        let employee = await app.model.Employee.findAll({
            condition: condition
        });
        if(employee.length){
            for(j in employee){
            employee[j].identity = JSON.parse(Buffer.from(employee[j].identity, 'base64').toString()); 
            }
            return {
                employee: employee,
                isSuccess: true,
                foundWith: fields[i],
                status: "employee"
            }
        }
        let pendingEmp = await app.model.Pendingemp.findAll({
            condition: condition
        });
        if(pendingEmp.length){
            for(j in pendingEmp){
            pendingEmp[j].identity = JSON.parse(Buffer.from(pendingEmp[j].identity, 'base64').toString()); 
            }
            return {
                employee: pendingEmp,
                isSuccess: true,
                foundWith: fields[i],
                status: "pending employee"
            }
        }
    }
    return {
        isSuccess: false, 
        message: "Not found in " + JSON.stringify(fields)
    }
});

app.route.post('/getCategories', async function(req, cb){
    var categories = await app.model.Category.findAll({
        condition: {
            deleted: '0'
        },
        fields: ['name']
    });
    var array = [];
    for(i in categories){
        array.push(categories[i].name)
    }
    return {
        categories: array
    }
})