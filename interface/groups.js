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
            email: req.query.email,
            deleted: '0'
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
            email: req.query.email,
            deleted: '0'
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
    
    var priority = await app.model.Deplevel.findOne({
        condition: {
            department: check.department,
            designation: check.designation
        }
    });

    var pendingPayslips = await app.model.Issue.findAll({
        condition: {
            status: 'pending',
            authLevel: priority.priority
        }
    });

    var authCount = await app.model.Authorizer.count({
        department: check.department,
        designation: check.designation,
        deleted: '0'
    });

    for(i in pendingPayslips){
        if(pendingPayslips[i].count === authCount - 1){
            var level = priority.priority + 1;
            while(1){
                var designation = await app.model.Deplevel.findOne({
                    condition: {
                        department: check.department,
                        priority: level
                    }
                });
                if(!designation){
                    app.sdb.update('issue', {status: 'authorized'}, {pid: pendingPayslips[i].pid});
                    level--;
                    break;
                }
                var authLevelCount = await app.model.Authorizer.count({
                    department: check.department,
                    designation: designation.designation,
                    deleted: '0'
                });
        
                if(authLevelCount) {
                    break;
                }

                level++;
            }
            app.sdb.update('issue', {authLevel: level}, {pid: pendingPayslips[i].pid});
            app.sdb.update('issue', {count: 0}, {pid: pendingPayslips[i].pid})
        }
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

app.route.post('/department/define', async function(req, cb){
    await locker('/department/define');
    var departments = req.query.departments;
    for(let i in departments){
        for(let j in departments[i].levels){
            app.sdb.create('deplevel', {
                id: app.autoID.increment('deplevel_max_id'),
                department: departments[i].name,
                designation: departments[i].levels[j],
                priority: j
            });
        }
    }
    return {
        isSuccess: true
    }
});

app.route.post('/department/add', async function(req, cb){
    await locker('/department/add');
    var department = req.query.department
    var departmentExists = await app.model.Deplevel.exists({
        department: department.name
    })
    if(departmentExists) return {
        message: "Department already exists",
        isSuccess: false
    }
    for(let i in department.levels){
        app.sdb.create('deplevel', {
            id: app.autoID.increment('deplevel_max_id'),
            department: department.name,
            designation: department.levels[i],
            priority: i
        });
    }
    return {
        isSuccess: true
    }
});

app.route.post('/department/get', async function(req, cb){
    var departments = await app.model.Deplevel.findAll({
        fields: ['department']
    });
    var departmentsSet = new Set();
    for(let i in departments) {
        departmentsSet.add(departments[i].department)
    };

    var departmentArray = Array.from(departmentsSet);
    console.log(departmentArray)
    for(i in departmentArray){
        var obj = {
            name: departmentArray[i],
            levels: []
        }
        var levels = await app.model.Deplevel.findAll({
            condition: {
                department: departmentArray[i]
            },
            fields: ['designation']
        });

        for(j in levels){
            obj.levels.push(levels[j].designation)
        }

        departmentArray[i] = obj
    }

    return {
        departments: departmentArray,
        isSuccess: true
    }
})

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

app.route.post('/employee/remove', async function(req, cb){
    await locker('/employee/remove');
    var exists = await app.model.Employee.findOne({
        condition: {
            empid: req.query.empid,
            deleted: '0'
        },
        fields: ['email']
    });
    if(!exists) return {
        message: "Invalid Employee id",
        isSuccess: false
    }
    app.sdb.update('employee', { deleted: '1'}, {empid: req.query.empid});

    var activityMessage = "Employee" + exists.email + " has been removed.";
    app.sdb.create('activity', {
        activityMessage: activityMessage,
        pid: req.query.empid,
        timestampp: new Date().getTime(),
        atype: 'employee'
    });
    
})

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

    for(i in issues){
        var payslip = await app.model.Payslip.findOne({
            condition: {
                pid: issues[i].pid
            },
            fields: ['email', 'month', 'year']
        });
        issues[i].employeeEmail = payslip.email;
        issues[i].month = payslip.month;
        issues[i].year = payslip.year;

        var issuer = await app.model.Issuer.findOne({
            condition: {
                iid: issues[i].iid
            },
            fields: ['email']
        });

        issues[i].issuerEmail = issuer.email;
    }
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
    for(i in issues){
        var authCount = await app.model.Authorizer.count({
            department: issues[i].department,
            deleted: '0'
        });
        issues[i].authCount = authCount

        var payslip = await app.model.Payslip.findOne({
            condition: {
                pid: issues[i].pid
            },
            fields: ['email', 'month', 'year']
        });

        issues[i].employeeEmail = payslip.email;
        issues[i].month = payslip.month;
        issues[i].year = payslip.year;

        var issuer = await app.model.Issuer.findOne({
            condition: {
                iid: issues[i].iid
            },
            fields: ['email']
        });

        issues[i].issuerEmail = issuer.email;
    }
    return {
        issues: issues,
        total: count,
        isSuccess: true
    }
})

app.route.post('/payslip/getSigns', async function(req, cb){
    var issue = await app.model.Issue.findOne({
        condition: {
            pid: req.query.pid
        }
    });
    if(!issue) return {
        message: "Invalid Payslip",
        isSuccess: false
    }

    var signed = [];
    var unsigned = [];
    var authorizers = await app.model.Authorizer.findAll({
        condition: {
            deleted: '0',
            department: issue.department
        }
    });
    for(i in authorizers){
        var sign = await app.model.Cs.findOne({
            condition: {
                aid: authorizers[i].aid,
                pid: req.query.pid
            }
        });
        if(sign){
            sign.email = authorizers[i].email
            signed.push(sign)
        }else{
            unsigned.push(authorizers[i])
        }
    }
    return {
        signed: signed,
        unsigned: unsigned,
        authCount: authorizers.length,
        isSuccess: true
    }
})

app.route.post('/getBanks', async function(req, cb){
    var banks = await app.model.Employee.findAll({
        fields: ['bank']
    });
    var bankSet = new Set();
    for(i in banks){
        bankSet.add(banks[i].bank)
    }
    
    return {
        banks: Array.from(bankSet),
        isSuccess: true
    }
})
