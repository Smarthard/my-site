
let Op = require('sequelize').Op;
let express = require('express');
let router = express.Router();

let allowFor = require('../auth/middleware').allowFor;

let ShikiVideos = require('../models').ShikiVideos;

/* path /api/shikivideos/ */

/* CREATE */

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
        return next(new Error('Missing required parameters'));

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
            uploader: uploader.username
        })
            .then(record => {
                if (!record)
                    throw new Error('Cannot insert new record');

                return res.status(201).send(record);
            })
    } catch (err) {
        console.error(err);

        return next(err);
    }
});

/* READ */

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
        limit: limit, offset: offset
    });

    if (article) {
        res.status(200).send(article);
    } else {
        res.status(500);
    }
});

router.get('/unique', (req, res, next) => {
    const AVAILABLE_COLUMNS = ['anime_id', 'anime_russian', 'anime_english', 'author'];
    const column = req.query.column;
    const anime_id = req.query.anime_id || null;

    if (!column || !AVAILABLE_COLUMNS.includes(`${column}`.toString().toLowerCase()))
        next(new Error('Requested column is not available'));

    let search_options = {
        attributes: [column],
        group: [column]
    };

    if (anime_id)
        search_options.where = { anime_id: anime_id };

    ShikiVideos.findAll(search_options)
        .then(columns => {
            res.status(200).send(columns);
        })
        .catch(err => next(err));
});

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
            where: sql_dyn_where, limit: limit, offset: offset
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
