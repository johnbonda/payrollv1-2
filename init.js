module.exports = async function () {
  console.log('enter dapp init')

  app.registerContract(1000, 'domain.register')
  app.registerContract(1001, 'domain.set_ip')
  app.registerContract(1003, 'payroll.issuePaySlip')
  app.registerContract(1004, 'payroll.verify')
  app.registerContract(1006, 'temp.insertIntoEmployees')
  app.registerContract(1007, 'payroll.registerEmployee')
  app.registerContract(1008, 'payroll.authorize')
  app.registerContract(1009, 'payroll.registerUser')
  app.registerContract(1010, 'temp.saveTransactionId')
  //app.registerContract(1005, 'payroll.pay')
  //app.registerFee(1005, '0', 'BEL')
  app.registerFee(1003, '0', 'BEL')
  app.registerFee(1004, '0', 'BEL')
  app.registerFee(1006, '0', 'BEL')
  app.registerFee(1007, '0', 'BEL')
  app.registerFee(1008, '0', 'BEL')
  app.registerFee(1009, '0', 'BEL')
  app.registerFee(1010, '0', 'BEL')
app.sdb.create("count",{
  id:0,
  pid:0,
  aid:0,
  iid:0,
  empid:0
});


  app.events.on('newBlock', (block) => {
    console.log('new block received', block.height)
  })
}