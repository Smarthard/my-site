let express = require('express');
let router = express.Router();

let Users = require('../models').User;
let middleware = require('../auth/middleware');

/* path /auth/ */

router.post('/login', (req, res) => {
    const login = req.body.login;
    const password = req.body.password;

    if (!login || !password || login.length > 16 || password.length > 32) {
        return res.status(400).send({ message: 'Parameters validation failed' });
    }

    Users.findOne({ where: { login: login }})
        .then(async user => {
            if (!!user && await middleware.validateUser(user, password)) {
                let proxy_user = JSON.parse(JSON.stringify(user));
                proxy_user.password = undefined;    // remove password's hash from the response

                req.session.user = proxy_user;
                res.json(proxy_user);
            } else {
                res.status(400).send({ message: 'Login or Password is incorrect'});
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).send();
        });
});

router.get('/logout', middleware.allowFor('default'), (req, res) => {
   if (req.session.user) {
       req.session.destroy();
       res.clearCookie('user_sid');
       res.status(200).send({ message: 'logged out successfully' })
   } else {
       res.status(401).send();
   }
});

router.get('/me', middleware.allowFor('user'), (req, res) => {
    res.status(200).send(req.session.user);
});

module.exports = router;
