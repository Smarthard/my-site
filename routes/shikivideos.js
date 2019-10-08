const ServerError = require('../types/ServerError');

let Op = require('sequelize').Op;
let express = require('express');
let router = express.Router();

let allowFor = require('../auth/middleware').allowFor;

let ShikiVideos = require('../models').ShikiVideos;

/* path /api/shikivideos/ */

/* CREATE */

/**
 * @swagger
 * /api/shikivideos:
 *  post:
 *      summary: Upload new link to video archive
 *      description: Create new record
 *      tags:
 *          - Shikivideos
 *      security:
 *          - BearerAuth:
 *              - token
 *          - OAuth2:
 *              - database:shikivideos
 *              - database:shikivideos_create
 *      produces:
 *          - application/json
 *      parameters:
 *          - name: url
 *            description: link to remote embedded player (should be unique, see Responses)
 *            in: query
 *            type: string
 *            required: true
 *          - name: anime_id
 *            description: Shikimori's anime ID
 *            in: query
 *            type: integer
 *            required: true
 *          - name: episode
 *            description: episode no.
 *            in: query
 *            type: integer
 *            required: true
 *          - name: kind
 *            description: video's kind (raw/dubs/subs)
 *            in: query
 *            schema:
 *              $ref: '#/components/schemas/ShikivideosKinds'
 *            required: true
 *          - name: language
 *            description: dub/sub's language
 *            in: query
 *            type: integer
 *            required: true
 *          - name: uploader
 *            description: Shikimori user's ID
 *            in: query
 *            type: string
 *            required: true
 *          - name: anime_english
 *            description: anime name in English
 *            in: query
 *            type: string
 *            required: false
 *          - name: anime_russian
 *            description: anime name in Russian
 *            in: query
 *            type: string
 *            required: false
 *          - name: author
 *            description: author of dubs/subs
 *            in: query
 *            type: string
 *            required: false
 *          - name: quality
 *            description: video's quality
 *            in: query
 *            type: string
 *            required: false
 *      responses:
 *          201:
 *              description: Created
 *          202:
 *              description: Accepted, but URL already exists
 *          400:
 *              description: Invalid required parameters
 *          500:
 *              description: Server fails on some operation, try later
 */
router.post('/', allowFor('database:shikivideos', 'database:shikivideos_create'), async (req, res, next) => {
    const url = req.query.url;
    const anime_id = req.query.anime_id;
    const anime_english = req.query.anime_english || "";
    const anime_russian = req.query.anime_russian || "";
    const episode = req.query.episode;
    const kind = req.query.kind;
    const language = req.query.language;
    const quality = req.query.quality || null;
    const author = req.query.author || null;
    const uploader = req.query.uploader;

    if (!url || !anime_id || !episode || !kind || !language || !uploader)
        return next(new ServerError('Required parameters missing', 'Invalid required parameter', 400));

    try {
        let existing_url = await ShikiVideos.findOne({ where: { url: url }});

        if (existing_url)
            return res.status(400).send({ message: 'Record with this url already exists' });

        ShikiVideos.create({
            url: url,
            anime_id: anime_id,
            anime_english: anime_english,
            anime_russian: anime_russian,
            episode: episode,
            kind: kind,
            language: language,
            quality: quality,
            author: author,
            uploader: uploader
        })
            .then(record => {
                if (!record)
                    throw new ServerError('Cannot insert new record', 'Internal Error', 500);

                return res.status(201).send(record);
            })
    } catch (err) {
        console.error(err);

        return next(err);
    }
});

/* READ */

/**
 * @swagger
 * /api/shikivideos/search:
 *  get:
 *      summary: Find anime by name
 *      description: Find anime with specified name (russian or english)
 *      tags:
 *          - Shikivideos
 *      produces:
 *          - application/json
 *      parameters:
 *          - name: title
 *            description: anime's title in Russian or English
 *            in: query
 *            type: string
 *            required: false
 *          - name: episode
 *            description: anime's episode no.
 *            in: query
 *            type: integer
 *            required: false
 *          - name: quality
 *            description: video's quality
 *            in: query
 *            type: string
 *            required: false
 *          - name: author
 *            description: author of dubs/subs
 *            in: query
 *            type: string
 *            required: false
 *          - name: kind
 *            description: video's kind (raw/dubs/subs)
 *            in: query
 *            schema:
 *              $ref: '#/components/schemas/ShikivideosKinds'
 *            required: false
 *          - name: lang
 *            description: dub/sub's language
 *            in: query
 *            type: string
 *            required: false
 *          - name: uploader
 *            description: video's uploader
 *            in: query
 *            type: string
 *            required: false
 *          - name: offset
 *            description: offset in database's selection response
 *            in: query
 *            type: integer
 *            required: false
 *          - name: limit
 *            description: maximum of database's selection size
 *            in: query
 *            type: integer
 *            required: false
 *      responses:
 *          200:
 *              description: Founded results
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: array
 *                          items:
 *                              $ref: '#/components/schemas/Shikivideos'
 *          500:
 *              description: Server fails on some operation, try later
 */
router.get('/search', async (req, res) => {
    const offset = req.query.offset || 0;
    let limit = req.query.limit || 10;

    const title = req.query.title || "";
    const episode = parseInt(req.query.episode) || 0;
    const quality = req.query.quality;
    const author = req.query.author;
    const kind = req.query.kind;
    const language = req.query.lang;
    const uploader = req.query.uploader;

    let sql_dyn_where = {};
    let sql_title_where = {};

    if (title) {
        sql_title_where = {
            [Op.or]: [
                {anime_russian: {[Op.like]: title}},
                {anime_english: {[Op.like]: title}}
            ]
        }
    }

    if (author) sql_dyn_where.author = author;
    if (episode) sql_dyn_where.episode = episode;
    if (kind) sql_dyn_where.kind = kind;
    if (language) sql_dyn_where.language = language;
    if (uploader) sql_dyn_where.uploader = uploader;
    if (quality) sql_dyn_where.quality = quality;
    if (limit) `${limit}`.toLocaleUpperCase() === 'ALL' ? limit = null : limit;


    let article = await ShikiVideos.findAll({
        where: [
                sql_title_where,
                sql_dyn_where
        ],
        order: ['author'],
        limit: limit, offset: offset
    });

    if (article) {
        res.status(200).send(article);
    } else {
        res.status(500);
    }
});

/**
 * @swagger
 * /api/shikivideos/unique/count:
 *  get:
 *      summary: Count unique values in videos archive
 *      description: count unique values of specified column in videos
 *      tags:
 *          - Shikivideos
 *      produces:
 *          - application/json
 *      parameters:
 *          - name: column
 *            description: column to find unique values
 *            in: query
 *            schema:
 *              type: string
 *              enum:
 *                  - anime_id
 *                  - anime_russian
 *                  - anime_english
 *                  - author
 *            required: true
 *          - name: anime_id
 *            description: filter by anime ID.
 *            in: query
 *            type: integer
 *            required: false
 *          - name: filter
 *            description: find records with specified value
 *            in: query
 *            type: string
 *            required: false
 *      responses:
 *          200:
 *              description: OK
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/ShikivideosLengthResponse'
 *          400:
 *              description: Invalid required parameters
 *          500:
 *              description: Server fails on some operation, try later
 */
router.get('/unique/count', (req, res, next) => {
    const AVAILABLE_COLUMNS = ['anime_id', 'anime_russian', 'anime_english', 'author', 'kind', 'url'];
    const column = req.query.column;
    const anime_id = req.query.anime_id;
    const filter = req.query.filter;
    const episode = req.query.episode;

    if (!column || !AVAILABLE_COLUMNS.includes(`${column}`.toString().toLowerCase()))
        next(new ServerError(`Available columns: ${AVAILABLE_COLUMNS}`, 'Invalid required parameter', 400));

    let search_options = {
        plain: false,
        order: [column]
    };

    if (anime_id)
        search_options.where = { anime_id: anime_id };
    if (anime_id && episode)
        search_options.where.episode = episode;

    ShikiVideos.aggregate(column, 'DISTINCT', search_options)
        .then(columns => {
            let values = columns.map(col => col.DISTINCT) || [];
            if (filter)
                values = values.filter(val => val && val.toString().includes(filter));

            res.status(200).send({ length: values.length });
        })
        .catch(err => next(err));
});

/**
 * @swagger
 * /api/shikivideos/unique:
 *  get:
 *      summary: List unique values in videos archive
 *      description: Find unique values of specified column in videos
 *      tags:
 *          - Shikivideos
 *      produces:
 *          - application/json
 *      parameters:
 *          - name: column
 *            description: column to find unique values
 *            in: query
 *            schema:
 *              type: string
 *              enum:
 *                  - anime_id
 *                  - anime_russian
 *                  - anime_english
 *                  - author
 *            required: true
 *          - name: anime_id
 *            description: filter by anime ID.
 *            in: query
 *            type: integer
 *            required: false
 *          - name: filter
 *            description: find records with specified value
 *            in: query
 *            type: string
 *            required: false
 *      responses:
 *          200:
 *              description: Founded results
 *          400:
 *              description: Invalid required parameters
 *          500:
 *              description: Server fails on some operation, try later
 */
router.get('/unique', async (req, res, next) => {
    const AVAILABLE_COLUMNS = ['anime_id', 'anime_russian', 'anime_english', 'author', 'kind', 'url'];
    const columns = req.query.column.split(' ');
    const anime_id = req.query.anime_id;
    const filter = req.query.filter;
    const episode = req.query.episode;
    const limit = req.query.limit || 50;
    const offset = req.query.offset;

    const distinctValuesHandler = (values) => {
        let uniq = {};

        if (filter) {
            let expression = new RegExp(filter, 'i');

            values = values.filter(val => {
                return Object.keys(val)
                    .some(key => val[key] ? expression.test(val[key].toString()) : "");
            });
        }

        values.forEach(value => {
            if (!uniq[value.episode])
                uniq[value.episode] = {};

            Object.keys(value).forEach(key => {
                if (!uniq[value.episode][key])
                    uniq[value.episode][key] = new Set()
            });

            Object.keys(value).forEach(key => {
                let unique = key === 'url' ? new URL(value[key]).hostname : value[key];
                uniq[value.episode][key].add(unique);
            });
        });

        Object.keys(uniq).forEach(episode => {
            Object.keys(uniq[episode]).forEach(key => {
                if (key === 'episode') {
                    delete uniq[episode][key];
                    return;
                }
                uniq[episode][key] = [...uniq[episode][key]];
            })
        });

        return uniq;
    };

    if (!columns || !anime_id || !columns.every(value => AVAILABLE_COLUMNS.includes(value)))
        next(new ServerError(`Available columns: ${AVAILABLE_COLUMNS}`, 'Invalid required parameter', 400));

    let search_options = {
        where: { anime_id: anime_id },
        limit: limit === 'all' ? null : limit,
        offset: offset,
        attributes: [...columns, 'episode']
    };

    if (episode)
        search_options.where.episode = episode;

    let response = await ShikiVideos.findAll(search_options)
        .then(values => distinctValuesHandler(values.map(v => v.dataValues)))
        .catch(err => next(err));

    if (episode) {
        response = response[episode] || [];
    }

    res.status(200).send(response);
});

/**
 * @swagger
 * /api/shikivideos/{anime_id}:
 *  get:
 *      summary: Find anime by ID
 *      description: Find animes with specified ID (ID is related to Shikimori's API anime_id)
 *      tags:
 *          - Shikivideos
 *      produces:
 *          - application/json
 *      parameters:
 *          - name: anime_id
 *            description: ID of anime from Shikimori's API
 *            in: path
 *            type: integer
 *            required: true
 *          - name: episode
 *            description: anime's episode no.
 *            in: query
 *            type: integer
 *            required: false
 *          - name: quality
 *            description: video's quality
 *            in: query
 *            type: string
 *            required: false
 *          - name: author
 *            description: author of dubs/subs
 *            in: query
 *            type: string
 *            required: false
 *          - name: kind
 *            description: video's kind (raw/dubs/subs)
 *            in: query
 *            schema:
 *              $ref: '#/components/schemas/ShikivideosKinds'
 *            required: false
 *          - name: lang
 *            description: dub/sub's language
 *            in: query
 *            type: string
 *            required: false
 *          - name: uploader
 *            description: video's uploader
 *            in: query
 *            type: string
 *            required: false
 *          - name: offset
 *            description: offset in database's selection response
 *            in: query
 *            type: integer
 *            required: false
 *          - name: limit
 *            description: maximum of database's selection size
 *            in: query
 *            type: integer
 *            required: false
 *      responses:
 *          200:
 *              description: Founded results
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: array
 *                          items:
 *                              $ref: '#/components/schemas/Shikivideos'
 *          400:
 *              description: Invalid required parameters
 *          500:
 *              description: Server fails on some operation, try later
 */
router.get('/:anime_id', async (req, res) => {
    const anime_id = req.params.anime_id;
    const offset = req.query.offset || 0;
    let limit = req.query.limit || 10;

    const episode = req.query.episode;
    const quality = req.query.quality;
    const author = req.query.author;
    const kind = req.query.kind;
    const language = req.query.lang;
    const uploader = req.query.uploader;

    let articles;
    let sql_dyn_where = {anime_id: anime_id};

    if (episode) sql_dyn_where.episode = episode;
    if (quality) sql_dyn_where.quality = quality;
    if (author) sql_dyn_where.author = author;
    if (kind) sql_dyn_where.kind = kind;
    if (language) sql_dyn_where.language = language;
    if (uploader) sql_dyn_where.uploader = uploader;
    if (limit) `${limit}`.toLocaleUpperCase() === 'ALL' ? limit = null : limit;

    if (!isNaN(anime_id)) {
        articles = await ShikiVideos.findAll({
            where: sql_dyn_where, order: ['author'], limit: limit, offset: offset
        });
    } else {
        res.status(400).send({msg: `wrong value for parameter id: ${anime_id}`});
    }

    if (articles) {
        res.status(200).send(articles);
    } else {
        res.status(500);
    }
});

/* OTHER */

/**
 * @swagger
 * /api/shikivideos/{anime_id}/length:
 *  get:
 *      summary: Anime's max episode in archive
 *      description: get last anime episode no. from database
 *      tags:
 *          - Shikivideos
 *      produces:
 *          - application/json
 *      parameters:
 *          - name: anime_id
 *            description: ID of anime from Shikimori's API
 *            in: path
 *            type: integer
 *            required: true
 *      responses:
 *          200:
 *              description: Max episode of specified anime
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/ShikivideosLengthResponse'
 *          400:
 *              description: Invalid required parameters
 *          500:
 *              description: Server fails on some operation, try later
 */
router.get('/:anime_id/length', (req, res) => {
    const anime_id = req.params.anime_id;

    ShikiVideos.max('episode', {
        where: {
            anime_id: anime_id
        }
    }).then(value => {
        res.status(200).send({length: value});
    }).catch(err => {
        console.error(err);
        res.status(500);
    });
});

module.exports = router;
