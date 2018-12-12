module.exports = {

    name: 'topayslips',
    fields: [
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
            name: 'address',
            type: 'String',
            length: 255
        }
    ]
}