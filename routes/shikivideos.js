
let Op = require('sequelize').Op;
let ShikiVideos = require('../models').ShikiVideos;
let express = require('express');
let router = express.Router();

/* path /api/shikivideos/ */

/* READ */

router.get('/', async (req, res) => {
    const offset = req.query.offset;
    const limit = req.query.limit;
    let articles;

    if (limit && offset) {
        articles = await ShikiVideos.findAll({where: {}, limit: limit, offset: offset});
    } else {
        articles = await ShikiVideos.findOne({limit: 1, offset: 0});
    }

    if (articles) {
        res.status(200).send(articles);
    } else {
        res.status(500).send([]);
    }
});

router.get('/q', async (req, res) => {
    const title = req.query.title;
    const episode = req.query.ep;

    let article;

    if (title && episode) {
        article = await ShikiVideos.findAll({
            where: {
                [Op.and]: [
                    {
                        [Op.or]: [
                            {anime_russian: {[Op.like]: title}},
                            {anime_english: {[Op.like]: title}}
                        ]
                    },
                    {
                        episode: episode
                    }
                ]
            }
        });
    } else if (title) {
        article = await ShikiVideos.findAll({
            where: {
                [Op.or]: [
                    {anime_russian: {[Op.like]: title}},
                    {anime_english: {[Op.like]: title}}
                ]
            }
        });
    } else {
        res.status(400).send({message: `wrong value for parameter title: ${title}`})
    }

    if (article) {
        res.status(200).send(article);
    } else {
        res.status(500).send([]);
    }
});

/* OTHER */

router.post('/count', (req, res) => {
    ShikiVideos.findAndCountAll().then(value => {
        res.status(200).send({count: value.count});
    }).catch(err => {
        res.status(500).send({count: 0});
    });
});

module.exports = router;
