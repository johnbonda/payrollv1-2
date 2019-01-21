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
            name: 'identity',
            type: 'String',
            length: 1000,
        },
        {
            name: 'earnings',
            type: 'String',
            length: 2000,
        },
        {
            name: 'deductions',
            type: 'String',
            length: 2000,
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
            name: 'timestampp',
            type: 'String',
            length: 255
        },
        {
            name: 'deleted',
            type: 'String',
            length: 255
        }
    ]
}