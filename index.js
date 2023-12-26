const http = require('http');
const url = require('url');
const querystring = require('querystring');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const jwt = require('jsonwebtoken')
const util = require('util');
const { promisify } = require('util');
const cors = require('cors');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const renameAsync = promisify(fs.rename);
const unlinkAsync = promisify(fs.unlink);
const upload = multer({ dest: 'profileImg/' });

const hostname = '0.0.0.0';
const port = 3000;

const sessions = {};

var emailUser = ''

const server = http.createServer((req, res) => {
cors()(req, res, () => {
    res.setHeader('Access-Control-Allow-Origin', 'https://sweet-bombolone-4523a4.netlify.app');

res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, multipart/form-data');

res.setHeader('Access-Control-Allow-Credentials', true);

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
    if (req.method === 'OPTIONS') {
        res.writeHead(200, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Credentials': 'true',
        });
        res.end();
        return;
      }
      
    if(req.method==='PUT'&& req.url === '/upload'){
        handleFileUpload(req, res);
    }
    if(req.method==='GET'){
        const parsedUrl = url.parse(req.url);
        const query = querystring.parse(parsedUrl.query);
        let userData;
        if(parsedUrl.pathname==='/image'){
            try {
                (async()=>{
                    const { getimgfromemail } = require("./controller/users");
                    userData = await getimgfromemail(query);
                    admin.initializeApp({
                        credential: admin.credential.cert(serviceAccount),
                        databaseURL: process.env.FIRE,
                    });
                    
                    const database = admin.database();
					const img = path.basename(userData[0].imagem_perfil_name, path.extname(userData[0].imagem_perfil_name));
                    const retrieveImage = async (imgName) => {
                        const snapshot = await database.ref(`images/${imgName}`).once('value');
                        return snapshot.val();
                    };
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    const image = await retrieveImage(img);
					res.end(JSON.stringify({ image }));
                })();
            } catch (error) {
                console.error('Error retrieving image:', error);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
            }
        }
        if (parsedUrl.pathname==='/upload') {
            handleFileUpload(req, res);
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
});

server.listen(port, hostname, () => {});

async function handleFileUpload(req, res) {
    try {
        const chunks = [];
        let dataSize = 0;
		let body = '';

        req.on('data', (chunk) => {
            chunks.push(chunk);
            dataSize += chunk.length;
			body += chunk
        });
        req.on('end', async () => {
            const data1 = Buffer.concat(chunks);
			console.log(querystring.parse(body));
            const pattern = /name="id"\s*[\n\r]+\s*([\S]+)/;
            const matchId = pattern.exec(data1);
            const filenameRegex = /filename="([^"]+)"/;
            const matchFileName = data1.toString('utf-8').match(filenameRegex);
            if(matchFileName&&matchId){
                const originalFilename = matchFileName[1];
                const id=matchId[1]

                const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif'];
                const fileExtension = path.extname(originalFilename).toLowerCase();

                if (!allowedExtensions.includes(fileExtension)) {
                    await handleUploadError(res, 'File extension is not allowed.');
                    return;
                }
                
                if (dataSize > 10485760) {
                    await handleUploadError(res, 'File size exceeds the limit.');
                    return;
                }

                const timestampedFilename = `${Date.now()}_${originalFilename}`;
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    databaseURL: process.env.FIRE,
					storageBucket: 'gs://vue-store-da146.appspot.com',
                });
				
				const storage = admin.storage();
				const bucket = storage.bucket();
                const database = admin.database();

				const remoteFilePath = `images/${timestampedFilename}`;
				const file = bucket.file(remoteFilePath);
				const stream = file.createWriteStream();
				stream.end(data1);

				stream.on('finish', async () => {
					const imageUrl = `https://storage.googleapis.com/${bucket.name}/${remoteFilePath}`;
					await database.ref(`users/${id}/profileImage`).set(imageUrl);

					res.setHeader('Content-Type', 'application/json');
					res.end({
						message: 'ok',
					});
				});
            }
        });
    } catch (error) {
        console.error('Error handling file upload:', error);
        await handleUploadError(res, 'Internal Server Error.');
    }
}
  
  async function handleUploadError(res, filePath, errorMessage) {
    console.error(errorMessage);
    await unlinkAsync(filePath);
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end(errorMessage);
  }
  const getContentType = (extension) => {
    switch (extension) {
      case '.png':
        return 'image/png';
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.gif':
        return 'image/gif';
      default:
        return 'application/octet-stream';
    }
  };
  const isImageRequest = (fileName) => {
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif'];
    const extension = path.extname(fileName).toLowerCase();
    return imageExtensions.includes(extension);
  };