const bcrypt = require('bcrypt');

const ServerError = require('../types/ServerError');
const AccessTokens = require('../models').AccessToken;
const Scope = require('./Scope').Scope;
const User  = require('../models').User;

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
        const authorization = req.headers.authorization || "";

        // request with bearer token
        if (authorization.toLowerCase().startsWith('bearer')) {
            let access_token = authorization.replace(/bearer\s+/i, '');

            return AccessTokens.findOne({ where: { token: access_token }})
                .then(async (access) => {
                    if (!access || access.token !== access_token)
                        return next(new ServerError('Token is invalid or expired or granted to another client', 'Unauthorized', 401));

                    if (Date.now() > access.expires)
                        return next(new ServerError('Token is invalid or expired or granted to another client', 'Unauthorized', 401));

                    // uploader_id will be accessible from further handlers
                    const user = await User.findOne({ where: { id: access.user_id }});
                    req.uploader_id = user.shikimori_id;

                    // TODO: optimize this
                    let isAllowed = false;
                    access.scopes.forEach(scope => {
                        let scope_obj = new Scope(scope);

                        scopes.forEach(scp => isAllowed |= scope_obj.isAllowedFor(scp))
                    });

                    if (isAllowed)
                        return next();
                    else
                        return next(new ServerError('Token is invalid or expired or granted to another client', 'Not Allowed', 403));
                })
                .catch(err => next(err));
        }

        // request with session cookies
        if (req.session.user) {
            return next();
        }

        return next(new ServerError('You are not authorized to access this', 'Unauthorized', 401));
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
