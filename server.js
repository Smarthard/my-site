let express = require('express');
let path = require('path');
let http = require('http');
let cors = require('cors');
let bodyParser = require('body-parser');

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

const port = process.env.PORT || '3001';
app.set('port', port);

let server = http.createServer(app);
server.listen(port, () => console.log("Backed started started at " + port));

