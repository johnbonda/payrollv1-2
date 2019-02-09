var locker = require("../utils/locker");

app.route.post('/testingLocker', async function(req, cb){
    await locker('testingLocker');
    app.sdb.create("testing", {
        test: app.autoID.increment('testing_max_test'),
        value: "yo"
    });

    var autoID = app.autoID.get('testing_max_test');
    console.log("AutoID before locker: " + autoID);

    var value = await app.model.Testing.findOne({
        condition: {
            test: autoID
        }
    });

    if(value)
    console.log("Value after locker: " + value.value);

    await locker('testingLocker');
    
    var autoID = app.autoID.get('testing_max_test');
    console.log("AutoID before locker: " + autoID);

    var value = await app.model.Testing.findOne({
        test: autoID
    });

    console.log("Value after locker: " + value.value);
    
})

app.route.post('/anotherAPI', async function(req, cb){
    var value = await app.model.Testing.findOne({
        condition: {
            test: 1
        }
    });
    return value
})

app.route.post('/testingUpdateCondition', async function(req, cb){
    var array = ['a', 'aa', 'aaa', 'aaaa', 'aaaaa'];
    app.sdb.update('testing', {test: "updated"}, {
        value: {
            $in: array
        }
    })
})

app.route.post('/enterTestdata', async function(req, cb){
    var str = 'a';
    for(i = 0; i < 10; i++){
        str+='a';
        app.sdb.create('testing', {
            test: "not updated yet",
            value: str
        });
    }
})