async function connect(){
    if(global.con&&global.con.state!=='disconnected')
        return global.con;
    var mysql = require('mysql2/promise');
    var con = await mysql.createConnection({
        host: process.env.HOST,
        user: process.env.USER,
        password: process.env.PASSWORD,
        database: process.env.DATABASE
    });
    global.con=con;
    return con;
}
connect();
module.exports=connect;