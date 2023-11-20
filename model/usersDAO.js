class usersDAO {
    static async insertNewUser(user){
        const db = require('../db');
        const conn=await db();
        const [rows] = await conn.query("SELECT * FROM usuario WHERE email = ?",[user.email]);
        if(rows[0]===undefined)
            return await conn.query("INSERT INTO usuario(perfil_idperfil,email,senha,nome) VALUE (?,?,?,?)",["2",user.email,user.password,user.name]);
        else
            return "Email is registered";
    }
    static async checkEmailAndReturnPassword(user){
        const db = require('../db');
        const conn=await db();
        const [rows] = await conn.query("SELECT * FROM usuario WHERE email = ?",[user.email]);
        if(rows[0]!==undefined){
            return rows;
        }else
            return null;
    }
}

module.exports = usersDAO;