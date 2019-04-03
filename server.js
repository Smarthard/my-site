let express = require('express');
let path = require('path');
let http = require('http');

let app = express();
let articles = require('./routes/articles.js');

app.use('/api/articles/', articles);

app.all('*', (req, res) => {
    res.status(404).send({});
});

const port = process.env.PORT || '3001';
app.set('port', port);

let server = http.createServer(app);
server.listen(port, () => console.log("Backed started started at " + port));

