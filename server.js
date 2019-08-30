let express = require('express');
let http = require('http');
let cors = require('cors');
let bodyParser = require('body-parser');
let session = require('express-session');
let morgan = require('morgan');
let helmet = require('helmet');
let path = require('path');
let app = express();

let middleware = require('./auth/middleware');
let PGStore = require('connect-pg-simple')(session);

/* ROUTES */
let articles = require('./routes/articles');
let shikivideos = require('./routes/shikivideos');
let users = require('./routes/users');
let auth = require('./routes/authorization');
let oauth = require('./routes/oauth');

const { SESSION_SECRET, PRODUCTION } = require('./config/auth');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('trust proxy', true);
app.use(morgan(PRODUCTION ? 'combined' : 'dev'));
app.use(session({
    key: 'user_sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
        httpOnly: true,
        //secure: PRODUCTION, // removed because of nginx configuration
        sameSite: 'lax',
        expires: 24 * 60 * 60 * 1000
    },
    store: new PGStore({
        tableName: 'Sessions',
        // TODO: conString refactor?
        conString: process.env.DATABASE_URL || 'pg://postgres@127.0.0.1:5432/myhutdb'
    })
}));
app.use(cors());
app.use(helmet({
    hsts: false // disabled because of nginx configuration
}));
app.use((req, res, next) => middleware.destroyInvalidCookies(req, res, next));

app.use(express.static(path.join(__dirname, 'views')));
app.use('/api/articles/', articles);
app.use('/api/shikivideos/', shikivideos);
app.use('/api/users/', users);
app.use('/auth/', auth);
app.use('/oauth/', oauth);
app.use(/^\/api\/?$/i, (req, res) => {
    res.send({ api_version: 'v1'});
});

app.all('*', (req, res) => {
    res.status(404).send({});
});

app.use((err, req, res, next) => {
    res.status(err.status || 500).send({
        error: err.brief,
        message: PRODUCTION? err.message : err.toString()
    });
});

let httpServer = http.createServer(app);

httpServer.listen(process.env.HTTP_PORT || '3001');
