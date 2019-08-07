let express = require('express');
let router = express.Router();
let uuid = require('uuid/v4');
let shortid = require('shortid');
let TokenGenerator = require('uuid-token-generator');

let {AUTH_CODE_LIFE, ACCESS_TOKEN_LIFE, REFRESH_TOKEN_LIFE} = require('../config/auth');
let allowFor = require("../auth/middleware").allowFor;

let tokens = new TokenGenerator(TokenGenerator.BASE62, 256);
let Scope = require('../auth/Scope').Scope;

let Clients = require('../models').Client;
let Users = require('../models').User;
let AuthCodes = require('../models').AuthCode;
let AccessTokens = require('../models').AccessToken;
let RefreshTokens = require('../models').RefreshToken;

function getHostName(url) {
    let match = url.match(/(?:https?:\/\/)(www[0-9]?\.)?(.[^\/:]+)/i);
    if (match != null && match.length > 2 && typeof match[2] === 'string' && match[2].length > 0) {
        return match[2];
    }
    else {
        return null;
    }
}

/* path /oauth/ */

router.post('/register', allowFor('user', 'admin'), (req, res, next) => {
    let client_name = req.body.client_name;
    let redirect_uri = req.body.redirect_uri;
    let scopes = req.body.scopes || 'default';

    if (!client_name || client_name.length < 4 || client_name.length > 32)
        return next(new Error('Invalid parameter "client_name"'));

    if (!redirect_uri || redirect_uri > 2000 || getHostName(redirect_uri) === null)
        return next(new Error('Invalid parameter "redirect_uri'));

    if (!redirect_uri.startsWith('http'))
        redirect_uri = 'http://' + redirect_uri;

    if (scopes && scopes.length > 1024)
        return next(new Error('Invalid parameter "scopes"'));

    Clients.create({
        user_id: req.session.user.id,
        client_id: uuid(),
        client_secret: shortid.generate(),
        name: client_name,
        redirect_uri: redirect_uri
    }).then(record => {
        let client = {
            client_id: record.client_id,
            client_secret: record.client_secret,
            name: record.name,
            redirect_uri: record.redirect_uri
        };

        res.status(201).send(client);
    }).catch(err => {
        console.error(err);

        return next(new Error('an error occurred during operation'));
    });
});

/**
 * The way to obtain Authorization Code
 */
router.get('/authorize', (req, res, next) => {
    const response_type = req.query.response_type;
    const client_id = req.query.client_id;
    const redirect_uri = req.query.redirect_uri || '';
    const scopes = `${req.query.scopes}`;
    const state = req.query.state;

    if (!response_type)
        next(new Error('Parameter "response_type" required'));

    if (response_type === 'code') {
        Clients.findOne({ where: { client_id: client_id } })
            .then(client => {
                if (!client)
                    next(new Error('Invalid parameter "client_id"'));

                if (!client.redirect_uri.includes(redirect_uri) && !redirect_uri.includes(client.redirect_uri) )
                    next(new Error('Invalid parameter "redirect_uri"'));

                if (client.banned)
                    next(new Error('This client was banned'));

                req.session.client_id = client_id;
                req.session.redirect_uri = redirect_uri;
                req.session.scopes = Scope.normilize(scopes);
                req.session.state = state || uuid();
                res.redirect('/authorization.html');
            })
    }
});

/**
 * Authorization Code endpoint: user's permission validation & redirection to client's uri here
 */
router.post('/authorize', (req, res, next) => {
    const login = req.body.login;
    const password = req.body.password;
    const client_id = req.session.client_id;
    const redirect_uri = req.session.redirect_uri || '';
    const scopes = req.session.scopes;
    const state = req.session.state;

    Users.findOne({ where: { login: login }})
        .then( async user => {
            if (!!user && await middleware.validateUser(user, password)) {
                AuthCodes.create({
                    client_id: client_id,
                    user_id: user.id,
                    auth_code: shortid.generate(),
                    redirect_uri: redirect_uri,
                    scopes: scopes,
                    expires: Date.now() + AUTH_CODE_LIFE
                }).then(authcode => {
                    res.redirect(`${redirect_uri}?code=${authcode.auth_code}&state=${state}`)
                })
            } else {
                return next(new Error('Invalid user credentials'));
            }
        })
        .catch(err => {
            console.error(err);

            return next(new Error('an error occurred during operation'));
        });
});

/**
 * Obtain Access and Refresh Tokens with Authorization Code or Refresh Token
 */
router.all('/token', (req, res, next) => {
    const grant_type = req.query.grant_type;
    const client_id = req.query.client_id;
    const client_secret = req.query.client_secret;
    const redirect_uri = req.query.redirect_uri || '';
    const code = req.query.code;
    const refresh = req.query.refresh_token;

    /* get the Access and Refresh Tokens from Auhorization Code */
    if (grant_type === 'authorization_code') {
        Promise.all([
            AuthCodes.findOne({ where: { auth_code: code, client_id: client_id }}),
            Clients.findOne({ where: { client_id: client_id }})
        ])
            .then(([auth_code, client]) => {
                if (!auth_code)
                    return next(new Error('Invalid authorization code'));

                if (!client)
                    return next(new Error('Invalid client credentials'));

                if (Date.now() > auth_code.expires) {
                    AuthCodes.destroy({ where: { auth_code: code }});
                    return next(new Error('Authorization Code expired'));
                }

                if (getHostName(redirect_uri) !== getHostName(client.redirect_uri))
                    return next(new Error('Redirect uri mismatch'));

                const access_token = tokens.generate();
                const refresh_token = tokens.generate();
                const user_id = auth_code.user_id;
                const scopes = auth_code.scopes;

                Promise.all([
                    AccessTokens.create({
                        token: access_token,
                        user_id: user_id,
                        client_id: client_id,
                        scopes: scopes,
                        expires: Date.now() + ACCESS_TOKEN_LIFE
                    }),
                    RefreshTokens.create({
                        token: refresh_token,
                        user_id: user_id,
                        client_id: client_id,
                        scopes: scopes,
                        expires: Date.now() + REFRESH_TOKEN_LIFE
                    }),
                    AuthCodes.destroy({ where: { auth_code: code, client_id: client_id }})
                ]).then(([access, refresh]) => {
                    let tokens_response = {
                        access_token: access.token,
                        refresh_token: refresh.token,
                        scopes: scopes,
                        exprires: access.expires,
                        token_type: 'Bearer'
                    };

                    return res.status(200).send(tokens_response);
                }).catch(err => {
                    console.error(err);
                    return next(new Error('Internal server error'));
                })
            }).catch(err => {
                console.error(err);
                return next(new Error('Internal server error'));
            });
    }

    /* refresh the Access and Refresh Tokens with Refresh Token */
    if (grant_type === 'refresh_token') {
        Promise.all([
            Clients.findOne({where: {client_id: client_id, client_secret: client_secret}}),
            RefreshTokens.findOne({where: {token: refresh}}),
        ]).then(([client, refresh_t]) => {
            if (!client || !refresh_t || refresh_t.client_id !== client.client_id)
                return next(new Error('Invalid request'));

            if (Date.now() > refresh_t.expires)
                return next(new Error('Refresh Token expired'));

            const access_token = tokens.generate();
            const refresh_token = tokens.generate();
            const user_id = refresh_t.user_id;
            const client_id = refresh_t.client_id;
            const scopes = refresh_t.scopes;

            Promise.all([
                AccessTokens.destroy({where: {user_id: user_id, client_id: client_id}}),
                // Don't destroy a refresh token if you'd like to track token hijacking
                AccessTokens.create({
                    token: access_token,
                    user_id: user_id,
                    client_id: client_id,
                    scopes: scopes,
                    expires: Date.now() + ACCESS_TOKEN_LIFE
                }),
                RefreshTokens.create({
                    token: refresh_token,
                    user_id: user_id,
                    client_id: client_id,
                    scopes: scopes,
                    expires: Date.now() + REFRESH_TOKEN_LIFE
                })
            ]).then(([d_access, access, refresh]) => {
                let tokens_response = {
                    access_token: access.token,
                    refresh_token: refresh.token,
                    exprires: access.expires,
                    token_type: 'Bearer'
                };

                return res.status(200).send(tokens_response);
            }).catch(err => {
                console.error(err);

                return next(new Error('Internal server error'));
            })
        }).catch(err => {
            console.error(err);

            return next(new Error('Internal server error'));
        })
    }
});

module.exports = router;
