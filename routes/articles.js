let Article  = require('../models').Article;
let express = require('express');
let router = express.Router();

/* path /api/articles/ */

router.get('/', async (req, res) => {
    const offset = req.query.offset || 0;
    const limit = req.query.limit || 10;

    let articles = await Article.findAll({where: {}, limit: limit, offset: offset});

    if (articles) {
        res.status(200).send(articles);
    } else {
        res.status(404).send();
    }
});

router.get('/:id', async (req, res) => {
    const id = req.params.id;

    let article = await Article.findOne({where: {id: id}});

    if (article) {
        res.status(200).send(article);
    } else {
        res.status(404).send();
    }
});

module.exports = router;
