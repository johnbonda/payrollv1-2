var util = require("../utils/util.js");
var config = require("../config.json");
var SwaggerCall = require("../utils/SwaggerCall");

app.route.post('/totalCertsIssued', async function(req, cb)
{ 
    var totalCerts = await app.model.Issue.count({status:"issued"});
    return {
        totalCertificates: totalCerts,
        isSuccess: true
    };
});

app.route.post('/totalEmployee', async function(req, cb)
{ 
   var totalemp= await app.model.Employee.count({});
    return {
         totalEmployee: totalemp,
         isSuccess: true
        };
});

//- get all employees name, id, designation with dappid
app.route.post('/employee/details',async function(req,cb){
var res=await app.model.Employee.findAll({fields:['empID','name','designation']})
return res;
});


app.route.post('/recentIssued', async function(req, cb)
{ 
    var res=await app.model.Issue.findAll({
        condition:{
            status:"issued"
        },
        sort: {
            timestamp: -1
        },
        fields:['pid'], 
        limit: 6 
    });
    
  return res;
});



app.route.post('/getEmployees', async function(req, cb)
{ 
    return await app.model.Employee.findAll({});
})

app.route.post('/getEmployeeById', async function(req, cb)
{ 
    return await app.model.Employee.findOne( {condition : { empID : req.query.id }} );
})