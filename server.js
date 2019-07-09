let express = require('express');
let fs = require('fs');
let http = require('http');
let cors = require('cors');
let bodyParser = require('body-parser');


const httpPort = process.env.HTTP_PORT || '3001';

let app = express();
let articles = require('./routes/articles.js');

app.use(cors());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.use('/api/articles/', articles);
app.use('/api', (req, res) => {
	res.send('API v1');
});

app.all('*', (req, res) => {
    res.status(404).send({});
});

let httpServer = http.createServer(app);

httpServer.listen(httpPort);
