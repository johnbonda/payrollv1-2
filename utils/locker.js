var sleep = require("./sleep");
module.exports = async function(str){
    while(1){
        try{
            app.sdb.lock(str);
            break;
        }catch(e){
            sleep(2000);
            continue;
        }
    }
}