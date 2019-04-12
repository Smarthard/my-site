let express = require('express');
let fs = require('fs');
let http = require('http');
let https = require('https');
let cors = require('cors');
let bodyParser = require('body-parser');

const privateKey = fs.readFileSync('../certs/server.key');
const certificate = fs.readFileSync('../certs/server.crt');
const credentials = {key: privateKey, cert: certificate};

const httpPort = process.env.HTTP_PORT || '3001';
const httpsPort = process.env.HTTPS_PORT || '3443';

let app = express();
let articles = require('./routes/articles.js');

app.use(cors());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.use('/api/articles/', articles);

app.all('*', (req, res) => {
    res.status(404).send({});
});

let httpServer = http.createServer(app);
let httpsServer = https.createServer(credentials, app);

httpServer.listen(httpPort);
httpsServer.listen(httpsPort);
