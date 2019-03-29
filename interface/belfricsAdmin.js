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
})