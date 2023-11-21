const http = require('http');
const url = require('url');
const querystring = require('querystring');
const bcrypt = require('bcrypt');
const fs = require('fs');
const multer = require('multer');
const jwt = require('jsonwebtoken')
const { promisify } = require('util');
const renameAsync = promisify(fs.rename);
const unlinkAsync = promisify(fs.unlink);
const upload = multer({ dest: 'profileImg/' });

const hostname = '0.0.0.0';
const port = 3000;

const sessions = {};

var emailUser = ''

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    const chunks = [];
    if(req.url==='/'){
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Hello World');
    }
    if(req.url==='/products'){
        (async()=>{
            const {getProducts} = require("./controller/products");
            const prodcts= await getProducts();
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(prodcts));
            res.end();
        })();
    }
    if (req.method === 'POST' && req.url === '/upload') {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('oi');
        const uploadMiddleware = upload.single('image');
        uploadMiddleware(req, res, async (err) => {
            if (err) {
                console.error(err);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error uploading file');
                return;
            }
            const file = req.file;
            if (file.size > 10485760) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('File size exceeds the limit.');
                fs.unlinkSync(file.path);
                return;
            }
            const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif']; // Add more extensions as needed
            const fileExtension = file.originalname.substr(file.originalname.lastIndexOf('.')).toLowerCase();

            if (!allowedExtensions.includes(fileExtension)) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('File extension is not allowed.');
                await unlinkAsync(file.path);
                return;
            }
            if (fs.existsSync(file.path)) {
                const newName = `${Date.now()}_${file.originalname}`;
                const newPath = `profileImg/${newName}`;
                fs.rename(file.path, newPath, (err) => {
                    if (err) {
                        console.error(err);
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Error renaming file');
                        return;
                    }
                    console.log(global.userEmail)
                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    res.end("Profile Image Updated");
                });
            }else {
                console.error(`File ${file.path} does not exist`);
                res.status(500).send('Error uploading file');
            }
        });
    }
    if(req.method==='GET'){
        const parsedUrl = url.parse(req.url);
        const query = querystring.parse(parsedUrl.query);
        if(parsedUrl.pathname==='/updateUser'){
            global.userEmail = query.e
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/plain');
            res.end();
        }
        if(parsedUrl.pathname==='/search'){
            (async()=>{
                const {searchProducts} = require("./controller/products");
                const result=await searchProducts(query);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ searched: result }));
            })();
        }
        if(parsedUrl.pathname==='/registerVue'){
            (async()=>{
                const saltRounds = 10;
                const salt = await bcrypt.genSalt(saltRounds);
                query.password = await bcrypt.hash(query.password, salt);
                const {insertNewUser} = require("./controller/users");
                const result=await insertNewUser(query);
                if(result==="Email is registered"){
                    res.statusCode = 301;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'email is alredy in use' }));
                }
                else{
                    global.userEmail = query.email
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ password: result[0].senha }));
                }
            })();
        }
        if (parsedUrl.pathname === '/checkLogin') {
            const { checkEmailAndReturnPassword } = require("./controller/users");
            (async()=>{
                try {
                    const userData = await checkEmailAndReturnPassword(query);
                    if (userData === null) {
                        res.statusCode = 401;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ error: 'Invalid email' }));
                    } else {
                        bcrypt.compare(query.password, userData[0].senha, function(err, result) {
                            (async()=>{
                                if (result === true) {
                                    global.userEmail = query.email
                                    res.statusCode = 200;
                                    res.setHeader('Content-Type', 'application/json');
                                    res.end(JSON.stringify(userData));
                                } else {
                                    res.statusCode = 401;
                                    res.setHeader('Content-Type', 'application/json');
                                    res.end(JSON.stringify({ error: 'Invalid password' }));
                                }
                            })();
                        });
                    }
                } catch (err) {
                    console.error(err);
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'Internal server error' }));
                }
            })();
        }
        if(parsedUrl.pathname==='/getbooksvue'){
            const {getProducts} = require("./controller/products");
            getProducts().then((productsData) => {
                if(productsData === null) {
                    res.statusCode = 401;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'Do not exists products' }));
                }else{
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(productsData));
                }
            }).catch((err) => {
                console.error(err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Internal server error' }));
            });
        }
        if(parsedUrl.pathname==='/getcatvue'){
            const {getcat} = require("./controller/products");
            getcat().then((catData) => {
                if(catData === null) {
                    res.statusCode = 401;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'Do not exists products' }));
                }else{
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(catData));
                }
            }).catch((err) => {
                console.error(err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Internal server error' }));
            });
        }
    }
});

server.listen(port, hostname, () => {});