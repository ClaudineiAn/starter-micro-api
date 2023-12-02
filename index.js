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
        if(parsedUrl.pathname==='/image'){
            try {
                (async()=>{
                    const db = await connectToDatabase();
                    const bucket = new GridFSBucket(db, { bucketName });
            
                    const downloadStream = bucket.openDownloadStreamByName('uploaded_image.png');
            
                    downloadStream.on('data', (chunk) => res.write(chunk));
                    downloadStream.on('end', () => res.end());
                    downloadStream.on('error', (error) => {
                    console.error('Error reading image from MongoDB:', error);
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Internal Server Error');
                    });
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
});

server.listen(port, hostname, () => {});

async function handleFileUpload(req, res) {
    try {
        const chunks = [];
        let dataSize = 0;

        req.on('data', (chunk) => {
            chunks.push(chunk);
            dataSize += chunk.length;
        });
        req.on('end', async () => {
            const data = Buffer.concat(chunks);
            data = Buffer.from(data, 'base64');

            const contentDisposition = req.headers['content-disposition'];
            const match = contentDisposition && contentDisposition.match(/filename="(.+)"\r\n/);

            if (match) {
                const originalFilename = match[1];

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
                const { updateProfilePicture } = require("./controller/users");
                await updateProfilePicture({
                    imagem_perfil_data: data,
                    imagem_perfil_name: timestampedFilename,
                    imagem_perfil_type: getContentType(fileExtension),
                });
    
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end(timestampedFilename);
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