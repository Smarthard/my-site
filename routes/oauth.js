const ServerError = require('../types/ServerError');

let express = require('express');
let router = express.Router();
let uuid = require('uuid/v4');
let shortid = require('shortid');
let TokenGenerator = require('uuid-token-generator');

let {AUTH_CODE_LIFE, ACCESS_TOKEN_LIFE, REFRESH_TOKEN_LIFE} = require('../config/auth');
let middleware = require("../auth/middleware");

let tokens = new TokenGenerator(TokenGenerator.BASE62, 256);
let Scope = require('../auth/Scope').Scope;

let Clients = require('../models').Client;
let Users = require('../models').User;
let AuthCodes = require('../models').AuthCode;
let AccessTokens = require('../models').AccessToken;
let RefreshTokens = require('../models').RefreshToken;

function getHostName(uri) {
    let url = /^http/i.test(`${uri}`) ? url : `http://${uri}`;

    return new URL(url).hostname;
}

function generateTokens(client_id, user_id, scopes, optional) {
    return new Promise((resolve, reject) => {
        const access_token = tokens.generate();
        const refresh_token = tokens.generate();

        let opt = optional || {};

        scopes = Scope.normilize(scopes);

        // optional operations may be executed
        let opt_operations = {
            delete_old_tokens: !!opt.delete_old_tokens
                ? () => AccessTokens.destroy({where: {user_id: user_id, client_id: client_id}})
                : () => Promise.resolve(),

            delete_auth_code: !!opt.delete_auth_code
                ? () => AuthCodes.destroy({ where: { auth_code: opt.code, client_id: client_id }})
                : () => Promise.resolve(),

            refresh_token: !!opt.refresh_token
                ? () => RefreshTokens.create({
                        token: refresh_token,
                        user_id: user_id,
                        client_id: client_id,
                        scopes: scopes,
                        expires: Date.now() + REFRESH_TOKEN_LIFE
                    })
                : () => Promise.resolve()
        };

        if (!client_id || !user_id || !scopes)
            reject(new ServerError('Missing required parameters', 'Invalid required parameter', 400));

        Promise.all([
            opt_operations.delete_old_tokens(),
            // Don't destroy a refresh token if you'd like to track token hijacking
            AccessTokens.create({
                token: access_token,
                user_id: user_id,
                client_id: client_id,
                scopes: scopes,
                expires: Date.now() + ACCESS_TOKEN_LIFE
            }),
            opt_operations.refresh_token(),
            opt_operations.delete_auth_code()
        ]).then(([d_access, access, refresh, d_auth_code]) => {
            let tokens_response = {
                access_token: access.token,
                expires: access.expires,
                token_type: 'Bearer'
            };

            if (!!opt.refresh_token)
                tokens_response.refresh_token = refresh.token;

            resolve(tokens_response);
        }).catch(err => reject(err));
    })
}

/* path /oauth/ */

/**
 * @swagger
 * /oauth/register:
 *  post:
 *      summary: Register new client
 *      description: Register new client for logged in user
 *      tags:
 *          - OAuth2
 *      security:
 *          - BearerAuth:
 *              - token
 *          - OAuth2:
 *              - default
 *      produces:
 *          - application/json
 *      parameters:
 *          - name: client_name
 *            description: Name of the client
 *            in: query
 *            type: string
 *            required: true
 *          - name: redirect_uri
 *            description: Redirect URI on success
 *            in: query
 *            type: string
 *            required: true
 *          - name: scopes
 *            description: Permissions required or granted for Client
 *            in: query
 *            schema:
 *              $ref: '#/components/schemas/OAuthScopes'
 *            required: false
 *      responses:
 *          201:
 *              description: Created
 *          401:
 *              description: Unauthorized
 *          500:
 *              description: Server fails on some operation, try later
 */
router.post('/register', middleware.allowFor('user', 'admin'), (req, res, next) => {
    let client_name = req.body.client_name;
    let redirect_uri = req.body.redirect_uri;
    let scopes = req.body.scopes || 'default';

    if (!client_name || client_name.length < 4 || client_name.length > 32)
        return next(new ServerError('Invalid parameter "client_name"', 'Invalid required parameter', 400));

    if (!redirect_uri || redirect_uri > 2000 || !/urn:ietf:wg:oauth:2.0:oob/.test(redirect_uri) && getHostName(redirect_uri) === null)
        return next(new ServerError('Invalid parameter "redirect_uri', 'Invalid required parameter', 400));

    if (!redirect_uri.startsWith('http') && !/urn:ietf:wg:oauth:2.0:oob/.test(redirect_uri))
        redirect_uri = 'http://' + redirect_uri;

    if (scopes && scopes.length > 1024)
        return next(new ServerError('Invalid parameter "scopes"', 'Invalid required parameter', 400));

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

        return next(new ServerError('An error occurred during operation', 'Internal Error', 500));
    });
});

/**
 * @swagger
 * /oauth/authorize:
 *  get:
 *      summary: Request Authorization Code
 *      description: Authorization Code is a token that allows your Client to get Access and Refresh Tokens
 *      tags:
 *          - OAuth2
 *      produces:
 *          - application/json
 *      parameters:
 *          - name: response_type
 *            description: Type of response to obtain Authorization Code (only "code" type supported)
 *            in: query
 *            schema:
 *              $ref: '#/components/schemas/OAuthResponseType'
 *            required: true
 *          - name: client_id
 *            description: ID of the OAuth2 Client
 *            in: query
 *            type: string
 *            required: true
 *          - name: redirect_uri
 *            description: Redirect URI on success
 *            in: query
 *            type: string
 *            required: true
 *          - name: scopes
 *            description: Permissions required or granted for Client
 *            in: query
 *            schema:
 *              $ref: '#/components/schemas/OAuthScopes'
 *            required: true
 *          - name: state
 *            description: Random string to verify response for your request
 *            in: query
 *            type: string
 *            required: false
 */
router.get('/authorize', (req, res, next) => {
    const response_type = req.query.response_type;
    const client_id = req.query.client_id;
    const redirect_uri = req.query.redirect_uri || '';
    const scopes = `${req.query.scopes}`;
    const state = req.query.state;

    if (!response_type)
        next(new ServerError('Parameter "response_type" required', 'Invalid required parameter', 400));

    if (response_type === 'code') {
        Clients.findOne({ where: { client_id: client_id } })
            .then(client => {
                if (!client)
                    next(new ServerError('Invalid parameter "client_id"', 'Invalid required parameter', 400));

                if (!client.redirect_uri.includes(redirect_uri) && !redirect_uri.includes(client.redirect_uri) )
                    next(new ServerError('Invalid parameter "redirect_uri"', 'Invalid required parameter', 400));

                if (client.banned)
                    next(new ServerError('This client was banned', 'Invalid client', 403));

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
            if (!!user && !user.banned && await middleware.validateUser(user, password)) {
                AuthCodes.create({
                    client_id: client_id,
                    user_id: user.id,
                    auth_code: shortid.generate(),
                    redirect_uri: redirect_uri,
                    scopes: scopes,
                    expires: Date.now() + AUTH_CODE_LIFE
                }).then(authcode => {
                    if (/urn:ietf:wg:oauth:2.0:oob/.test(redirect_uri)) {
                        console.warn('here');
                        res.send({ code: authcode.auth_code, state })
                    } else {
                        res.redirect(`${redirect_uri}?code=${authcode.auth_code}&state=${state}`)
                    }
                })
            } else {
                return next(new ServerError('Invalid user credentials', 'Unauthorized', 401));
            }
        })
        .catch(err => {
            console.error(err);

            return next(new ServerError('An error occurred during operation', 'Internal Error', 500));
        });
});

/**
 * @swagger
 * /oauth/token:
 *  get:
 *      summary: Obtain Access and Refresh Tokens with Authorization Code or Refresh Token
 *      description: Tokens for access to secured resources
 *      tags:
 *          - OAuth2
 *      produces:
 *          - application/json
 *      parameters:
 *          - name: grant_type
 *            description: "Type of request for access grant:
 *              \n
 *              * authorization_code - Request for access token with granted permissions
 *              \n
 *              * refresh_token - Request for renew access token
 *              \n
 *              * client_credentials - Request for access token as owner of client (only for trusted clients)
 *              "
 *            in: query
 *            schema:
 *              $ref: '#/components/schemas/OAuthGrantType'
 *            required: true
 *          - name: client_id
 *            description: ID of the OAuth2 Client
 *            in: query
 *            type: string
 *            required: true
 *          - name: client_secret
 *            description: secret of the OAuth2 Client
 *            in: query
 *            type: string
 *            required: true
 *          - name: redirect_uri
 *            description: Redirect URI on success
 *            in: query
 *            type: string
 *            required: true
 *          - name: code
 *            description: Authorization Code. Required on "Authorization Code" Grant Type
 *            in: query
 *            type: string
 *            required: false
 *          - name: scopes
 *            description: Permissions required or granted for Client, "default" if empty
 *            in: query
 *            schema:
 *              $ref: '#/components/schemas/OAuthScopes'
 *            required: false
 *          - name: refresh_token
 *            description: Required on "Refresh Token" Grant Type to renew Access Token
 *            in: query
 *            type: string
 *            required: false
 *      responses:
 *          200:
 *              description: OK
 *          400:
 *              description: Invalid required parameters
 *          401:
 *              description: Unauthorized
 *          500:
 *              description: Server fails on some operation, try later
 */
router.all('/token', (req, res, next) => {
    const grant_type = req.query.grant_type;
    const client_id = req.query.client_id;
    const client_secret = req.query.client_secret;
    const redirect_uri = req.query.redirect_uri || '';
    const code = req.query.code;
    const scopes = req.query.scopes || ["default"];
    const refresh = req.query.refresh_token;

    /* get the Access and Refresh Tokens from Auhorization Code */
    if (grant_type === 'authorization_code') {
        Promise.all([
            AuthCodes.findOne({ where: { auth_code: code, client_id: client_id }}),
            Clients.findOne({ where: { client_id: client_id }})
        ])
            .then(async ([auth_code, client]) => {
                if (!auth_code)
                    return next(new ServerError('Invalid authorization code', 'Unauthorized', 401));

                if (!client)
                    return next(new ServerError('Invalid client credentials', 'Unauthorized', 401));

                if (Date.now() > auth_code.expires) {
                    AuthCodes.destroy({ where: { auth_code: code }});
                    return next(new ServerError('Authorization Code expired', 'Unauthorized', 401));
                }

                if (!/urn:ietf:wg:oauth:2.0:oob/.test(redirect_uri) && getHostName(redirect_uri) !== getHostName(client.redirect_uri))
                    return next(new ServerError('Redirect URI mismatch', 'Unauthorized', 401));

                try {
                    const user_id = auth_code.user_id;
                    const scopes = auth_code.scopes;
                    const options = { refresh_token: true, delete_auth_code: true, code: code };
                    const tokens = await generateTokens(client_id, user_id, scopes, options);

                    return res.status(200).send(tokens);
                } catch (err) {
                    return next(err);
                }
            }).catch(err => {
                console.error(err);
                return next(new ServerError('An error occurred during operation', 'Internal Error', 500));
            });
    }

    /* refresh the Access and Refresh Tokens with Refresh Token */
    if (grant_type === 'refresh_token') {
        Promise.all([
            Clients.findOne({where: {client_id: client_id, client_secret: client_secret}}),
            RefreshTokens.findOne({where: {token: refresh}}),
        ]).then(async ([client, refresh_t]) => {
            if (!client || !refresh_t || refresh_t.client_id !== client.client_id)
                return next(new ServerError('Token is invalid or expired or granted to another client', 'Unauthorized', 401));

            if (Date.now() > refresh_t.expires)
                return next(new ServerError('Token is invalid or expired or granted to another client', 'Unauthorized', 401));

            try {
                const user_id = refresh_t.user_id;
                const client_id = refresh_t.client_id;
                const scopes = refresh_t.scopes;
                const options = { refresh_token: true, delete_old_tokens: true };
                const tokens = await generateTokens(client_id, user_id, scopes, options);

                return res.status(200).send(tokens);
            } catch (err) {
                return next(err);
            }
        }).catch(err => {
            console.error(err);

            return next(new ServerError('An error occurred during operation', 'Internal Error', 500));
        })
    }

    if (grant_type === 'client_credentials') {
        Clients.findOne({ where: { client_id: client_id, client_secret: client_secret }})
            .then(async (client) => {
                if (!client)
                    return next(new ServerError('Invalid client credentials', 'Invalid request', 400));

                if (!client.is_trusted)
                    return next(new ServerError('This client is not trusted', 'Invalid request', 400));

                try {
                    const user_id = client.user_id;
                    const tokens = await generateTokens(client_id, user_id, scopes);

                    return res.status(200).send(tokens);
                } catch (err) {
                    console.error(err);

                    return next(err);
                }
            })
            .catch(err => {
                console.error(err);

                return next(new ServerError('An error occurred during operation', 'Internal Error', 500));
            })
    }
});

module.exports = router;
