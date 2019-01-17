var logger = require("../utils/logger");
var SuperDappCall = require("../utils/SuperDappCall");
var locker = require("../utils/locker");



// inputs: limit, offset
app.route.post('/issuers', async function(req, cb){
    logger.info("Entered /issuers API");
    var total = await app.model.Issuer.count({
        deleted: '0'
    });
    var result = await app.model.Issuer.findAll({
        condition: {
            deleted: '0'
        },
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
    var total = await app.model.Authorizer.count({
        deleted: '0'
    });
    var result = await app.model.Authorizer.findAll({
        condition: {
            deleted: '0'
        },
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
    await locker("/authorizers/remove");
    var check = await app.model.Authorizer.findOne({
        condition:{
            aid:req.query.aid,
            deleted: '0'
        }
    });
    if(!check) return {
        message: "Not found",
        isSuccess: false
    }
    var removeObj = {
        email: check.email,
    }
    var removeInSuperDapp = await SuperDappCall.call('POST', '/removeUsers', removeObj);
    if(!removeInSuperDapp) return {
        message: "No response from superdapp",
        isSuccess: false
    }
    if(!removeInSuperDapp.isSuccess) return {
        message: "Failed to delete",
        err: removeInSuperDapp,
        isSuccess: false
    }
    var pendingIssues = await app.model.Issue.findAll({
        condition: {
            status: {
                $in: ['pending', 'authorized']
            },
            category: check.category
        },
        fields: ['pid', 'count']
    });

    var countOfAuths = await app.model.Authorizer.count({
        category: check.category,
        deleted: '0'
    });

    for(i in pendingIssues){
        var signed = await app.model.Cs.exists({
            aid: req.query.aid,
            pid: pendingIssues[i].pid
        })
        if(signed) app.sdb.update('issue', {count: pendingIssues[i].count - 1}, {pid: pendingIssues[i].pid});
        else if(pendingIssues[i].count === countOfAuths - 1) app.sdb.update('issue', {status: 'authorized'}, {pid: pendingIssues[i].pid})
    }

    app.sdb.update('authorizer', {deleted: '1'}, {aid: check.aid});

    return {
        isSuccess: true
    };
});

app.route.post('/issuers/remove', async function(req, cb){
    logger.info("Entered /issuers/remove API");
    await locker("/issuers/remove");
    var check = await app.model.Issuer.findOne({
        condition:{
            iid:req.query.iid,
            deleted: '0'
        }
    });
    if(!check) return {
        message: "Not found",
        isSuccess: false
    }
    var removeObj = {
        email: check.email
    }
    var removeInSuperDapp = await SuperDappCall.call('POST', '/removeUsers', removeObj);
    if(!removeInSuperDapp) return {
        message: "No response from superdapp",
        isSuccess: false
    }
    if(!removeInSuperDapp.isSuccess) return {
        message: "Failed to delete",
        err: removeInSuperDapp,
        isSuccess: false
    }
    
    app.sdb.update('issuer', {deleted: '1'}, {iid: check.iid});

    return {
        isSuccess: true
    };
});

app.route.post('/category/define', async function(req, cb){
    await locker('/category/define');
    var defined = await app.model.Category.findAll({});
    if(defined.length) return {
        message: 'Categories already defined',
        isSuccess: false
    }
    var timestamp = new Date().getTime().toString();
    for(i in req.query.categories){
        app.sdb.create('category', {
            name: req.query.categories[i],
            deleted: '0',
            timestampp: timestamp
        })
    };
    return {
        isSuccess: true
    }
})

app.route.post('/category/add', async function(req, cb){
    await locker('/category/add');
    var exists = await app.model.Category.exists({
        name: req.query.name,
        deleted: '0'
    });
    if(exists) return {
        message: "The provided category already exists",
        isSuccess: false
    }
    app.sdb.create('category', {
        name: req.query.name,
        deleted: '0',
        timestampp: new Date().getTime().toString()
    })
    return {
        isSuccess: true
    }
});

app.route.post('/category/remove', async function(req, cb){
    await locker('/category/remove');
    var exists = await app.model.Category.exists({
        name: req.query.name,
        deleted: '0'
    });
    if(!exists) return {
        message: "The provided category does not exist",
        isSuccess: false
    }
    app.sdb.update('category', {deleted: '1'}, {name: req.query.name});
    return {
        isSuccess: true
    }
});

app.route.post('/category/get', async function(req, cb){
    await locker('/category/get');
    var categories = await app.model.Category.findAll({
        condition: {
            deleted: '0'
        },
        fields: ['name', 'timestampp']
    });
    return {
        categories: categories,
        isSuccess: true
    }
})

app.route.post('/customFields/define', async function(req, cb){
    await locker('/customFields/define');
    var setting = await app.model.Setting.findOne({
        condition: {
            id: '0'
        }
    })
    try{
    var earnings = Buffer.from(JSON.stringify(req.query.earnings)).toString('base64');
    var deductions = Buffer.from(JSON.stringify(req.query.deductions)).toString('base64');
    var identity = Buffer.from(JSON.stringify(req.query.identity)).toString('base64');
    }catch(err){
        return {
            message: "Enter valid inputs",
            isSuccess: false
        }
    }

    if(setting){
       app.sdb.update('setting', {earnings: earnings}, {id: '0'});
       app.sdb.update('setting', {deductions: deductions}, {id: '0'});
       app.sdb.update('setting', {identity: identity}, {id: '0'}); 
    }
    else{
        app.sdb.create('setting', {
            id: '0',
            earnings: earnings,
            deductions: deductions,
            identity: identity
        })
    }
    return {
        isSuccess: true
    }
});

app.route.post('/customFields/get', async function(req, cb){
    await locker('/customFields/get');
    var setting = await app.model.Setting.findOne({
        condition: {
            id: '0'
        }
    });
    if(!setting) return {
        message: "No setting defined",
        isSuccess: false
    }
    return {
        earnings: JSON.parse(Buffer.from(setting.earnings, 'base64').toString()),
        deductions: JSON.parse(Buffer.from(setting.deductions, 'base64').toString()),
        identity: JSON.parse(Buffer.from(setting.identity, 'base64').toString()),
        isSuccess: true
    }
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
