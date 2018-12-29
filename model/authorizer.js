module.exports = {
    name: "authorizers",
    fields: [
        {  
            name: 'aid',
            type: 'String', 
            length: 255,
            primary_key: true
        },
        {
            name: 'publickey',
            type: 'String',
            length: 255,
        },
        {
            name: 'email',
            type: 'String',
            length: 255,
        },
        {
            name: 'designation',
            type: 'String',
            length: 255,
        },
        {
            name: 'timestamp',
            type: 'String',
            length: 255,
        }
    ]
}
