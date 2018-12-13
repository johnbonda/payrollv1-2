module.exports = {
    name: "issues",
    fields: [
        {
            name: 'pid',
            type: 'String', 
            length: 255,
        },
        {
            name: 'iid',
            type: 'String', 
            length: 255,
        },
        {  
            name: 'hash',
            type: 'String', 
            length: 255,
        },
        {
            name: 'sign',
            type: 'String',
            length: 255,
        },
        {
            name: 'publickey',
            type: 'String',
            length: 255,
        },
        {
            name: 'timestamp',
            type: 'String',
            length: 255
        },
        {
            name :'status',
            type:'String',
            length: 255
        }
    ]
}
