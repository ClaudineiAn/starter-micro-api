async function connect(){
    if(global.con&&global.con.state!=='disconnected')
        return global.con;
    var mysql = require('mysql2/promise');
    var con = await mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "loja"
    });
    global.con=con;
    return con;
}
connect();
module.exports=connect;