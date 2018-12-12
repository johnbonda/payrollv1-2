var util = require("../utils/util.js");
var config = require("../config.json");
var SwaggerCall = require("../utils/SwaggerCall");

app.route.post('/totalCertsIssued', async function(req, cb)
{ 
    var totalCerts = await app.model.Mi.count({});
    return {
        totalCertificates: totalCerts
    };
})

app.route.post('/totalEmployees', async function(req, cb)
{ 
    return { totalEmployees : await app.model.Employee.count({}) };
})

app.route.post('/recentIssued', async function(req, cb)
{ 
    var num = await app.model.Mi.count({});
    let option = {
        offset: num - 6,
        limit: 6
        // if it not works then,
        // sort: {
        //     timestamp : {}
        // }
        
      };
      return (await app.model.Mi.findAll(option)).reverse();
})

app.route.post('/getEmployees', async function(req, cb)
{ 
    return await app.model.Employee.findAll({});
})

app.route.post('/getEmployeeById', async function(req, cb)
{ 
    return await app.model.Employee.findOne( {condition : { empID : req.query.id }} );
})