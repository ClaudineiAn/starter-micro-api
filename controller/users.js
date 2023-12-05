class users {
    static insertNewUser(user){
        const {insertNewUser} = require('../model/usersDAO');
        return insertNewUser(user);
    }
    static checkEmailAndReturnPassword(user){
        const {checkEmailAndReturnPassword} = require('../model/usersDAO');
        return checkEmailAndReturnPassword(user);
    }
    static updateProfilePicture(picture){
        const {updateNewPicture} = require('../model/usersDAO');
        return updateNewPicture(picture);
    }
    static getimgfromemail(user){
        const {getimgfromemail} = require('../model/usersDAO');
        return getimgfromemail(user);
    }
}

module.exports = users;