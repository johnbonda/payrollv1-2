var defaultFee = require('../config.json').defaultFee;

app.route.post('/admin/workDetails', async function(req){
    var issuersCount = await app.model.Issuer.count({
        deleted: '0'
    });
    var authorizersCount = await app.model.Authorizer.count({
        deleted: '0'
    });
    var recepientsCount = await app.model.Employee.count({
        deleted: '0'
    });
    var issuesCount = await app.model.Issue.count({
        status: 'issued'
    });
    return {
        isSuccess: true,
        issuersCount: issuersCount,
        authorizersCount: authorizersCount,
        recepientsCount: recepientsCount,
        issuesCount: issuesCount
    }
});

app.route.post('/admin/getContracts', async function(req){
    var contractObjects = app.custom.contractObjects;
    for(i in contractObjects){
        var currentFee = app.getFee(contractObjects[i].type);
        if(!currentFee) currentFee = {
            min: defaultFee
        }
        contractObjects[i].currentFee = currentFee.min
    }
    return {
        isSuccess: true,
        contracts: contractObjects
    }
});

app.route.post('/admin/setContractFees', async function(req){
    var getFees = req.query.fees;
    var contractObjects = app.custom.contractObjects;
    var failed = [];
    for(i in getFees){
        if(!contractObjects[getFees[i].contract]) {
            console.log("Wrong contracts detected");
            failed.push({
                contract: getFees[i].contract,
                message: "Contract doesn't exist on the DApp"
            })
            continue;
        }
        app.registerFee(contractObjects[getFees[i].contract].type, getFees[i].transactionFee, 'BEL');
    }
    return {
        isSuccess: true,
        failed: failed
    }
});

app.route.post('/admin/setContractFee', async function(req){
    if(!(req.query.contract && req.query.fee)) return {
        isSuccess: false,
        message: "Provide contract and fee"
    }
    var contractObjects = app.custom.contractObjects;
    if(!contractObjects[req.query.contract]) return {
        isSuccess: false,
        message: "Contract doesn't exist on the DApp"
    }
    app.registerFee(contractObjects[req.query.contract].type, req.query.fee, 'BEL');
    return {
        isSuccess: true
    }
})
