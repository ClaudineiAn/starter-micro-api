// config.js

const Parse = require('parse/node');

Parse.initialize(process.env.APPID, process.env.JAVASCRIPTKEY, process.env.MASTERKEY);
Parse.serverURL = 'https://parseapi.back4app.com/';

module.exports = Parse;
