
let Op = require('sequelize').Op;
let ShikiVideos = require('../models').ShikiVideos;
let express = require('express');
let router = express.Router();

/* path /api/shikivideos/ */

/* READ */

router.get('/search', async (req, res) => {
    const offset = req.query.offset || 0;
    let limit = req.query.limit || 10;

    const title = req.query.title;
    const episode = req.query.episode;
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
