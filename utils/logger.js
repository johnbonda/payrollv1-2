var log4js = require( "log4js" );
log4js.configure({
  appenders: { dappLogs: { type: 'file', filename: './logs/PayrollDapp/dappLogs.log' } },
  categories: { default: { appenders: ['dappLogs'], level: 'info' } }
});
module.exports = log4js.getLogger( "dappLogs" );