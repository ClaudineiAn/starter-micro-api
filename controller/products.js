class products {
    static home(){
        const db = require('../db');
        const {home} = require('../model/productsDAO');
        return home(db);
    }
    static getProducts(){
        const db = require('../db');
        const {getProducts} = require('../model/productsDAO');
        return getProducts(db);
    }
    static getcat(){
        const db = require('../db');
        const {getcat} = require('../model/productsDAO');
        return getcat(db);
    }
    static searchProducts(search){
        const db = require('../db');
        const {searchProducts} = require('../model/productsDAO');
        return searchProducts(db,search);
    }
}

module.exports = products;