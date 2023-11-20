class users {
    static insertNewUser(user){
        const {insertNewUser} = require('../model/usersDAO');
        return insertNewUser(user);
    }
    static checkEmailAndReturnPassword(user){
        const {checkEmailAndReturnPassword} = require('../model/usersDAO');
        return checkEmailAndReturnPassword(user);
    }
}

module.exports = users;