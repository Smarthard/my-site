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

/**
 * @swagger
 * /api/users:
 *  post:
 *      summary: Register new user
 *      description: Create new user if login is free
 *      tags:
 *          - User
 *      produces:
 *          - application/json
 *      parameters:
 *          - name: body
 *            in: body
 *            required: true
 *            type: object
 *            properties:
 *              login:
 *                type: string
 *                example: John
 *              password:
 *                type: string
 *                example: passw0rd
 *              email:
 *                type: string
 *                example: john@gmail.com
 *      responses:
 *          201:
 *              description: Created
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/UserWithoutPassword'
 *          401:
 *              description: Unauthorized
 *          500:
 *              description: Server fails on some operation, try later
 */
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

/**
 * @swagger
 * /api/users/:
 *  get:
 *      summary: List users
 *      description: Brief list of user with user's ID and username
 *      tags:
 *          - User
 *      produces:
 *          - application/json
 *      parameters:
 *          - name: limit
 *            in: query
 *            required: false
 *            type: integer
 *          - name: offset
 *            in: query
 *            required: false
 *            type: integer
 *      responses:
 *          200:
 *              description: OK
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: array
 *                          items:
 *                              type: object
 *                              properties:
 *                                  id:
 *                                      type: integer
 *                                      example: 123
 *                                  name:
 *                                      type: string
 *                                      example: username
 *          401:
 *              description: Unauthorized
 *          500:
 *              description: Server fails on some operation, try later
 */
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

/**
 * @swagger
 * /api/users/{id}:
 *  get:
 *      summary: Find user
 *      description: Find user with ID
 *      tags:
 *          - User
 *      produces:
 *          - application/json
 *      parameters:
 *          - name: id
 *            in: path
 *            required: true
 *            type: integer
 *      responses:
 *          200:
 *              description: OK
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              id:
 *                                  type: integer
 *                                  example: 123
 *                              name:
 *                                  type: string
 *                                  example: username
 *          401:
 *              description: Unauthorized
 *          404:
 *              description: No such user
 *          500:
 *              description: Server fails on some operation, try later
 */
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

/**
 * @swagger
 * /api/users/{id}:
 *  put:
 *      summary: Change user
 *      description: Change user with ID
 *      tags:
 *          - User
 *      security:
 *          - BearerAuth:
 *              - token
 *          - OAuth2:
 *              - user
 *              - admin
 *      produces:
 *          - application/json
 *      parameters:
 *          - name: id
 *            in: path
 *            required: true
 *            type: integer
 *      responses:
 *          200:
 *              description: OK
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/UserWithoutPassword'
 *          400:
 *              description: Invalid user ID
 *          401:
 *              description: Unauthorized
 *          500:
 *              description: Server fails on some operation, try later
 */
router.put('/:id', middleware.allowFor('user', 'admin'), async (req, res) => {
   const id = req.params.id;

   if (id && !isNaN(id)) {
       User.update(req.body, {where: {id: id}})
           .then(value => {
               res.status(200).send();
           })
           .catch(err => {
               console.error(err);

               res.status(500).send();
           });
   } else {
       res.status(400).send({message: `wrong value for parameter id: ${id}`})
   }
});

/* DELETE */

/**
 * @swagger
 * /api/users/{id}:
 *  delete:
 *      summary: Delete user
 *      description: Delete user with ID
 *      tags:
 *          - User
 *      security:
 *          - BearerAuth:
 *              - token
 *          - OAuth2:
 *              - user
 *              - admin
 *      produces:
 *          - application/json
 *      parameters:
 *          - name: id
 *            in: path
 *            required: true
 *            type: integer
 *      responses:
 *          200:
 *              description: OK
 *          400:
 *              description: Invalid user ID
 *          401:
 *              description: Unauthorized
 *          500:
 *              description: Server fails on some operation, try later
 */
router.delete('/:id', middleware.allowFor('user', 'admin'), async (req, res) => {
    const id = req.params.id;
    let deleted;

    if (id && !isNaN(id)) {
        deleted = await User.destroy({where: {id: id}});
    } else {
        res.status(400).send({message: `wrong value for parameter id: ${id}`})
    }

    if (deleted) {
        res.status(200).send({success: true, message: "article with id " + id + " removed"});
    } else {
        res.status(400).send({success: false, message: "wrong article id " + id});
    }
});

/* OTHER */
/**
 * @swagger
 * /api/users/count:
 *  post:
 *      summary: Count all users
 *      tags:
 *          - User
 *      produces:
 *          - application/json
 *      responses:
 *          200:
 *              description: OK
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              count:
 *                                  type: integer
 *                                  example: 2
 *          500:
 *              description: Server fails on some operation, try later
 */

router.post('/count', (req, res) => {
    User.findAndCountAll().then(value => {
        res.status(200).send({count: value.count});
    }).catch(err => {
        res.status(500).send({count: 0});
    });
});

module.exports = router;
