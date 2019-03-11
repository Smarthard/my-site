var express = require('express');
var path = require('path');
var http = require('http');

var app = express();
var api = require('./api');

app.use('/', api);

app.all('*', (req, res) => {
    res.status(404).send({});
});

const port = process.env.PORT || '3001';
app.set('port', port);

var server = http.createServer(app);
server.listen(port, ()=> console.log("Backed started started at " + port));

