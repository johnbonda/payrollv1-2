module.exports = {
    name: 'settings',
    fields: [
        {
            name: 'id',
            type: 'String',
            length: 255
        },
        {
            name: 'earnings',
            type: 'String',
            length: 255,
        },
        {
            name: 'deductions',
            type: 'String',
            length: 255,
        },
        {
            name: 'identity',
            type: 'String',
            length: 255
        },
        {
            name: 'otherEarnings',
            type: 'String',
            length: 2000,
        },
        {
            name: 'otherDeductions',
            type: 'String',
            length: 2000,
        }
    ]
}