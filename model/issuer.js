module.exports = {
    name: "issuers",
    fields: [
        {  
            name: 'iid',
            type: 'String', 
            length: 255,
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
            length: 255
        },
        {
            name: 'timestamp',
            type: 'String',
            length: 255
        },
    ]
}
