var config = require("../config.json");

module.exports = {
  fixedPoint : Math.pow(10, 10),
  defaultCurrency: 'BEL', // default currency symbole for Belrium
  totalSupply: 2100000000000000000,
  URL: "http://localhost:9305",
  URI: config.bkvs,
  URX: config.bkvs,
  CRX: "http://localhost:9305/api/dapps/" + config.superdapp ,
  LSR: "http://localhost:9305/api/dapps/",
  MRI: config.centralServer + "/sendMail/",
  fees: {
    send: 0.001,
    inTransfer: 0.001,
    outTransfer: 0.001
  }
}
