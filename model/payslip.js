module.exports = {

    name: 'payslips',
    fields: [
        {
            name: 'pid',
            type: 'String',
            length: 100,
            primary_key: true 
        },
        {
            name: 'email',
            type: 'String',
            length: 100,
            not_null: true,
        },
        {
            name: 'empid',
            type: 'String',
            length: 100,
        },
        {
            name: 'name',
            type: 'String',
            length: 100,
        },
        {
            name: 'employer', 
            type: 'String',
            length: 100,
        },
        {
            name: 'month',
            type: 'String',
            length: 100,
        },
        {
            name: 'year',
            type: 'String',
            length: 100,
        },
        {
            name: 'designation',
            type: 'String',
            length: 100,
        },
        {
            name: 'bank',
            type: 'String',
            length: 100,
        },
        {
            name: 'accountNumber',
            type: 'String',
            length: 100,
        },
        {
            name: 'pan',
            type: 'String',
            length: 100,
        },
        {
            name: 'basicPay',
            type: 'String',
            length: 100,
        },
        {
            name: 'hra',
            type: 'String',
            length: 100,
        },
        {
            name: 'lta',
            type: 'String',
            length: 100,
        },
        {
            name: 'ma',
            type: 'String',
            length: 100,
        },
        {
            name: 'providentFund',
            type: 'String',
            length: 100,
        },
        {
            name: 'professionalTax',
            type: 'String',
            length: 100,
        },
        {
            name: 'grossSalary',
            type: 'String',
            length: 100,
        },
        {
            name: 'totalDeductions',
            type: 'String',
            length: 100,
        },
        {
            name: 'netSalary',
            type: 'String',
            length: 100,
        },
        {
            name: 'timestamp',
            type: 'String',
            length: 255
        }
    ]
}