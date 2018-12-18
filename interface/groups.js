var schema = require('../schema/accounts.js');
var httpCall = require('../utils/httpCall.js');
var constants = require('../utils/constants.js');
var addressHelper = require('../utils/address.js');
var z_schema = require('../utils/zschema-express.js');
var BKVSCall = require('../utils/BKVSCall.js');
var SwaggerCall = require('../utils/SwaggerCall.js');
var request = require('request');
var auth = require('./authController');

app.route.post('/issuers', async function(req, cb){
    var result = await app.model.Issuer.findAll({});
    return result; 
});

app.route.post('/issuers/data', async function(req, cb){
    var result = await app.model.Issuer.findOne({
        condition: {
            email: req.query.email
        }
    });
    if(!result) return "Invalid Issuer";
    return result;
});

app.route.post('/authorizers', async function(req, cb){
    var result = await app.model.Authorizer.findAll({});
    return result;
});

app.route.post('/authorizers/data', async function(req, cb){
    var result = await app.model.Authorizer.findOne({
        condition: {
            email: req.query.email
        }
    });
    if(!result) return "Invalid Authorizer";
    return result;
});

// app.route.post('/authorizers/pendingSigns', async function(req, cb){
//     var check = await app.model.Authorizer.findOne({
//         condition:{
//             email: req.query.email
//         }
//     });
//     if(!check) return "Invalid authorizer email";
//     var signed = await app.model.Cs.findAll({
//         condition: {
//             aid: check.id
//         },
//         fields: ['upid']
//     });

//     var signedIdArray = ['-1'];
//     for(i in signed){
//         signedIdArray.push(signed[i].upid);
//     }

//     console.log("Signed: " + signed);
//     console.log("signedIdArray: " + signedIdArray);

//     var pendingSigns = await app.model.Ui.findAll({
//         condition: {
//             id: {
//                 $nin: signedIdArray
//             }
//         }
//     });

//     var pendingArray = ["-1"];
//     for (i in pendingSigns){
//         pendingArray.push(pendingSigns[i].id);
//     }

//     var details = await app.model.Ucps.findAll({
//         condition: {
//             id: {
//                 $in: pendingArray
//             }
//         }
//     });

//     var dictionary = {};
//     for(x in details){
//         dictionary[details[x].id] = {
//             email: details[x].email,
//             issuedOn: details[x].timestamp
//         }
//     }

//     for(i in pendingSigns){
//         pendingSigns[i].email = dictionary[pendingSigns[i].id].email;
//         pendingSigns[i].timestamp = dictionary[pendingSigns[i].id].issuedOn;
//     }

//     return pendingSigns;
// });

app.route.post('/payslips/unconfirmed', async function(req, cb){
    var unconfirmedPayslips = await app.model.Ui.findAll({});
    return unconfirmedPayslips;
});

app.route.post('/payslips/unconfirmed/data', async function(req, cb){
    var data = await app.model.Ucps.findOne({
        condition: {
            id: req.query.id
        }
    });
    return data;
});

app.route.post('/payslips', async function(req, cb){
    var confirmedPayslips = await app.model.Mi.findAll({});
    return confirmedPayslips;
});

app.route.post('/payslips/data', async function(req, cb){
    var data = await app.model.Mps.findOne({
        condition: {
            id: req.query.id
        }
    });
    return data;
});

app.route.post('/payslips/signatures', async function(req, cb){
    var data = await app.model.Authsign.findAll({
        condition: {
            mid: req.query.id
        }
    });
    return data;
});

app.route.post('/authorizers/remove', async function(req, cb){
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
    var check = await app.model.Issuer.exists({
       iid:req.query.iid
    })
    if(!check) return "not found";
    app.sdb.del('issuer', {
       iid: req.query.iid
    });
    return true;
});

app.route.post('/payslips/pendingsigns', async function(req, cb){
    var check = await app.model.Ui.exists({
        id: req.query.id
    });
    if(!check) return "Invalid id";
    var signs = await app.model.Cs.findAll({
        condition: {
            upid: req.query.id
        },fields: ['aid']
    });
    var totalAuthorizers=await app.model.Authorizer.findAll({fields: ['id']
    });
    var obj={
        signs:signs.length,
        totalAuthorizers:totalAuthorizers.length
    }
    return obj;
 });
