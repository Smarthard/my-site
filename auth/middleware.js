let bcrypt = require('bcrypt');

let AccessTokens = require('../models').AccessToken;
let Scope = require('./Scope').Scope;

function destroyInvalidCookies(req, res, next) {
    if (req.session.cookies && !req.session.user) {
        res.clearCookie('user_sid');
    }
    next();
}

/**
 * This middleware ensures that request is authorized by bearer token or session cookies.
 * Also it checks scopes for request and secured endpoint. Returns '401 Unauthorized' if any check fails
 *
 * @param scopes scopes that allowed for accessing this resources. NOTE that 'default' scope means any scope
 */
function allowFor(...scopes) {
    return function(req, res, next) {
        const authorization = req.headers.authorization;

        // request with session cookies
        if (req.session.user) {
            next();
        }

        // request with bearer token
        if (authorization.toLowerCase().startsWith('bearer')) {
            let access_token = authorization.replace(/bearer\s+/i, '');

            return AccessTokens.findOne({ where: { token: access_token }})
                .then(access => {
                    if (access.token !== access_token)
                        return next(new Error('Unauthorized'));

                    if (Date.now() > access.expires)
                        return next(new Error('Token expired'));

                    // TODO: optimize this
                    let isAllowed = true;
                    access.scopes.forEach(scope => {
                        let scope_obj = new Scope(scope);

                        scopes.forEach(scp => isAllowed &= scope_obj.isAllowedFor(scp))
                    });

                    if (isAllowed)
                        return next();
                    else
                        return next(new Error('Unauthorized'));
                })
                .catch(err => next(err));
        }

        return next(new Error('Unauthorized'));
    }
}

async function validateUser(user, password) {
    return await bcrypt.compare(password, user.password)
        .then(ok => ok)
        .catch(err => {
            console.error(err);
            return false;
        });
}

module.exports = {
    destroyInvalidCookies: destroyInvalidCookies,
    allowFor: allowFor,
    validateUser: validateUser
};
