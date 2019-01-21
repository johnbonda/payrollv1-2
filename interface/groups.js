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

    var activityMessage = "Authorizer " + check.email + " has been removed.";
    app.sdb.create('activity', {
        activityMessage: activityMessage,
        pid: check.aid,
        timestampp: new Date().getTime(),
        atype: 'authorizer'
    });

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

    var activityMessage = "Issuer " + check.email + " has been removed.";
    app.sdb.create('activity', {
        activityMessage: activityMessage,
        pid: check.iid,
        timestampp: new Date().getTime(),
        atype: 'issuer'
    });

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

app.route.post('/issuer/data', async function(req, cb){
    var issuer = await app.model.Issuer.findOne({
        condition: {
            iid: req.query.iid
        }
    });
    if(!issuer) return {
        message: "Invalid issuer",
        isSuccess: false
    }
    var employeeCount = await app.model.Employee.count({
        iid: req.query.iid
    })
    var issuedCount = await app.model.Issue.count({
        iid: req.query.iid,
        status: 'issued'
    });
    return {
        issuer: issuer,
        employeesRegistered: employeeCount,
        issuesCount: issuedCount,
        isSuccess: true
    }
})

app.route.post('/issuer/data/employeesRegistered', async function(req, cb){
    var issuer = await app.model.Issuer.findOne({
        condition: {
            iid: req.query.iid
        }
    });
    if(!issuer) return {
        message: "Invalid issuer",
        isSuccess: false
    }
    var count = await app.model.Employee.count({
        iid: req.query.iid
    })
    var employees = await app.model.Employee.findAll({
        condition: {
            iid: req.query.iid
        },
        limit: req.query.limit,
        offset: req.query.offset,
        fields: ['empid', 'email', 'name']
    });
    return {
        employees: employees,
        total: count,
        isSuccess: true
    }
});

app.route.post('/issuer/data/issuedPayslips', async function(req, cb){
    var issuer = await app.model.Issuer.findOne({
        condition: {
            iid: req.query.iid
        }
    });
    if(!issuer) return {
        message: "Invalid issuer",
        isSuccess: false
    }
    var count = await app.model.Issue.count({
        iid: req.query.iid,
        status: 'issued'
    })
    var issues = await app.model.Issue.findAll({
        condition: {
            iid: req.query.iid,
            status: 'issued'
        },
        limit: req.query.limit,
        offset: req.query.offset,
        fields: ['pid']
    });
    for(i in issues){
        var payslip = await app.model.Payslip.findOne({
            condition: {
                pid: issues[i].pid
            },
            fields: ['empid', 'month', 'year']
        });
        issues[i].empid = payslip.empid;
        issues[i].month = payslip.month;
        issues[i].year = payslip.year;
    }
    return {
        issues: issues,
        total: count,
        isSuccess: true
    }
});

app.route.post('/authorizer/data', async function(req, cb){
    var authorizer = await app.model.Authorizer.findOne({
        condition: {
            aid: req.query.aid
        }
    });
    if(!authorizer) return {
        message: "Invalid Authorizer",
        isSuccess: false
    }
    var signedCount = await app.model.Cs.count({
        aid: req.query.aid
    });
    var rejectedCount = await app.model.Rejected.count({
        aid: req.query.aid
    });
    return {
        authorizer: authorizer,
        signedCount: signedCount,
        rejectedCount: rejectedCount,
        isSuccess: true
    }
});

app.route.post('/authorizer/signedPayslips', async function(req, cb){
    var authorizer = await app.model.Authorizer.findOne({
        condition: {
            aid: req.query.aid
        }
    });
    if(!authorizer) return {
        message: "Invalid Authorizer",
        isSuccess: false
    }
    var count = await app.model.Cs.count({
        aid: req.query.aid
    })
    var signed = await app.model.Cs.findAll({
        condition: {
            aid: req.query.aid
        },
        limit: req.query.limit,
        offset: req.query.offset,
        fields: ['pid']
    });
    for(i in signed){
        var payslip = await app.model.Payslip.findOne({
            condition: {
                pid: signed[i].pid
            },
            fields: ['empid', 'month', 'year']
        });
        signed[i].empid = payslip.empid;
        signed[i].month = payslip.month;
        signed[i].year = payslip.year;
    }
    return {
        signed: signed,
        total: count,
        isSuccess: true
    }
});

app.route.post('/authorizer/data/rejected', async function(req, cb){
    var authorizer = await app.model.Authorizer.findOne({
        condition: {
            aid: req.query.aid
        }
    });
    if(!authorizer) return {
        message: "Invalid Authorizer",
        isSuccess: false
    }
    var count = await app.model.Rejected.count({
        aid: req.query.aid
    })
    var rejected = await app.model.Rejected.findAll({
        condition: {
            aid: req.query.aid
        },
        limit: req.query.limit,
        offset: req.query.offset
    });
    for(i in rejected){
        var issuer = await app.model.Issuer.findOne({
            condition: {
                iid: rejected[i].iid
            },
            fields: ['email']
        });
        rejected[i].issuedBy = issuer.email
    }
    return {
        rejected: rejected,
        total: count,
        isSuccess: true
    }
});

app.route.post('/payslip/issued', async function(req, cb){
    var count = await app.model.Issue.count({
        status: 'issued'
    })
    var issues = await app.model.Issue.findAll({
        condition: {
            status: 'issued'
        },
        limit: req.query.limit,
        offset: req.query.offset,
        sort: {
            timestampp: -1
        }
    });
    return {
        issues: issues,
        total: count,
        isSuccess: true
    }
});

app.route.post('/payslip/initiated', async function(req, cb){
    var count = await app.model.Issue.count({
        status: 'pending'
    })
    var issues = await app.model.Issue.findAll({
        condition: {
            status: 'pending'
        },
        limit: req.query.limit,
        offset: req.query.offset,
        sort: {
            timestampp: -1
        }
    });
    return {
        issues: issues,
        total: count,
        isSuccess: true
    }
})
