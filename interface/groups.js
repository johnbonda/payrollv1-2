var logger = require("../utils/logger");


// inputs: limit, offset
app.route.post('/issuers', async function(req, cb){
    logger.info("Entered /issuers API");
    var total = await app.model.Issuer.count({});
    var result = await app.model.Issuer.findAll({
        limit: req.query.limit,
        offset: req.query.offset
    });
    return {
        total: total,
        issuers: result
    }; 
});

app.route.post('/issuers/data', async function(req, cb){
    logger.info("Entered /issuers/data API");
    var result = await app.model.Issuer.findOne({
        condition: {
            email: req.query.email
        }
    });
    if(!result) return "Invalid Issuer";
    return result;
});

// inputs: limit, offset
app.route.post('/authorizers', async function(req, cb){
    logger.info("Entered /authorizers API");
    var total = await app.model.Authorizer.count({});
    var result = await app.model.Authorizer.findAll({
        limit: req.query.limit,
        offset: req.query.offset
    });
    return {
        total: total,
        authorizer: result
    }; 
});

app.route.post('/authorizers/data', async function(req, cb){
    logger.info("Entered /authoirzers/data");
    var result = await app.model.Authorizer.findOne({
        condition: {
            email: req.query.email
        }
    });
    if(!result) return "Invalid Authorizer";
    return result;
});

app.route.post('/authorizers/getId', async function(req, cb){
    var result = await app.model.Authorizer.findOne({
        condition:{
            email: req.query.email
        }
    });
    if(result){
        return {
            isSuccess: true,
            result: result
        }
    }
    return {
        isSuccess: false,
        message: "Authorizer not found"
    }
})

app.route.post('/employees/getId', async function(req, cb){
    var result = await app.model.Employee.findOne({
        condition:{
            email: req.query.email
        }
    });
    if(result){
        return {
            isSuccess: true,
            result: result
        }
    }
    return {
        isSuccess: false,
        message: "Employee not found"
    }
})

app.route.post('/issuers/getId', async function(req, cb){
    var result = await app.model.Issuer.findOne({
        condition:{
            email: req.query.email
        }
    });
    if(result){
        return {
            isSuccess: true,
            result: result
        }
    }
    return {
        isSuccess: false,
        message: "Issuer not found"
    }
})

app.route.post('/authorizers/remove', async function(req, cb){
    logger.info("Entered /authorizers/remove API");
    var check = await app.model.Authorizer.exists({
       aid:req.query.aid
    })
    if(!check) return "not found";
    app.sdb.del('Authorizer', {
       aid: req.query.aid
    });
    return true;
});

app.route.post('/issuers/remove', async function(req, cb){
    logger.info("Entered /issuers/remove API");
    var check = await app.model.Issuer.exists({
       iid:req.query.iid
    })
    if(!check) return "not found";
    app.sdb.del('issuer', {
       iid: req.query.iid
    });
    return true;
});

// app.route.post('/payslips/pendingsigns', async function(req, cb){
//     var check = await app.model.Ui.exists({
//         id: req.query.id
//     });
//     if(!check) return "Invalid id";
//     var signs = await app.model.Cs.findAll({
//         condition: {
//             upid: req.query.id
//         },fields: ['aid']
//     });
//     var totalAuthorizers=await app.model.Authorizer.findAll({fields: ['id']
//     });
//     var obj={
//         signs:signs.length,
//         totalAuthorizers:totalAuthorizers.length
//     }
//     return obj;
// });
