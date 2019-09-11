const ServerError = require('../types/ServerError');

let express = require('express');
let bcrypt = require('bcrypt');
let router = express.Router();

let middleware = require('../auth/middleware');

let User  = require('../models').User;

function isEmail(email) {
    return /[^\s]+@(gmail.com)/i.test(email);
}

/* path /api/users/ */

/* CREATE */

router.post('/', async (req, res, next) => {
    const login = req.body.login;
    const password = req.body.password;
    const email = req.body.email;

    if (!login || !password || !email)
        return next(new ServerError('Required parameters missing', 'Invalid required parameter', 400));

    if (login.length > 16 || password.length > 32 || login === '' || password === '' || !isEmail(email))
        return next(new ServerError('login/password is too long or too short, or email is invalid', 'Invalid parameters', 400));

    const existing_login = await User.findOne({ where: { login: login }});
    const existing_email = await User.findOne({ where: { email: email }});

    if (!existing_login && !existing_email) {
        return  User.create({
            login: login,
            name: login,
            password: bcrypt.hashSync(password, 10),
            email: email,
            scopes: [ 'user' ]
        })
            .then(user => {
                if (user) {
                    return res.status(201).send({
                        login: user.login,
                        name: user.name,
                        email: user.email,
                        scopes: user.scopes
                    });
                } else {
                    return next(new ServerError('An error occurred during operation', 'Internal Error', 500));
                }
            })
            .catch(err => {
                console.error(err);

                return res.status(400).send();
            });
    } else {
        return next(new ServerError('User with these login or email is exist', 'Invalid required parameter', 400));
    }
});

/* READ */

router.get('/', async (req, res) => {
    const offset = req.query.offset;
    const limit = req.query.limit;
    let users;

    if (limit && offset) {
        users = await User.findAll({
            limit: limit,
            offset: offset,
            attributes: [ 'id', 'name' ]
        });
    } else {
        users = await User.findAll({
            attributes: [ 'id', 'name' ]
        });
    }

    if (users) {
        res.status(200).send(users);
    } else {
        res.status(500).send([]);
    }
});

router.get('/:id', async (req, res) => {
    const id = req.params.id;
    let user;

    if (id && !isNaN(id)) {
        user = await User.findOne({
            where: {id: id},
            attributes: [ 'id', 'name' ]
        });
    } else {
        res.status(400).send({message: `wrong value for parameter id: ${id}`})
    }

    if (user) {
        res.status(200).send(user);
    } else {
        res.status(404).send();
    }
});

/* UPDATE */

router.put('/:id', middleware.allowFor('user', 'admin'), async (req, res, next) => {
   const id = req.params.id;

   if (id && !isNaN(id)) {
       let req_user = await User.findOne({ where: { id: req.session.user.id }}).catch(err => next(err));

       if (id == req.session.user.id || req_user.scopes.includes('admin')) {

           if (!req_user.scopes.includes('admin')) {
               req.body.id = undefined;     // do not change user id
               req.body.scopes = undefined; // ...and scopes
           }

           User.update(req.body, { where: {id: id} })
               .then(() => User.findOne({ where: { id: req.body.id || id }}))
               .then(user => {
                   return res.status(200).send({
                       id: user.id,
                       name: user.name,
                       login: user.login,
                       email: user.email,
                       scopes: user.scopes
                   });
               })
               .catch(err => next(err));
       } else {
           return next(new ServerError('Trying to change protected resources you don\'t belong to', 'Forbidden', 403));
       }
   } else {
       return next(new ServerError(`wrong value for parameter id: ${id}`, 'Invalid required parameter', 400));
   }
});

/* DELETE */

router.delete('/:id', middleware.allowFor('user', 'admin'), async (req, res, next) => {
    const id = req.params.id;

    if (id && !isNaN(id)) {
        let req_user = await User.findOne({ where: { id: req.session.user.id }}).catch(err => next(err));

        if (id == req.session.user.id || req_user.scopes.includes('admin')) {
            User.destroy({where: {id: id}})
                .then(() => {
                    return res.status(200).send({});
                })
                .catch(err => next(err));
        } else {
            return next(new ServerError('Trying to change protected resources you don\'t belong to', 'Forbidden', 403));
        }
    } else {
        return next(new ServerError(`wrong value for parameter id: ${id}`, 'Invalid required parameter', 400));
    }
});

/* OTHER */

router.post('/count', (req, res) => {
    User.findAndCountAll().then(value => {
        res.status(200).send({count: value.count});
    }).catch(err => {
        res.status(500).send({count: 0});
    });
});

module.exports = router;
