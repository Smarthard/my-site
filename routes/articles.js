let Article  = require('../models').Article;
let express = require('express');
let router = express.Router();

/* path /api/articles/ */

/* CREATE */

router.post('/', async (req, res) => {
    const entity = Article.build(req.body);

    entity.save().then(value => {
        if (value) {
            res.status(201).send(value);
        } else {
            res.status(500).send({message: "an error occurred during operation"});
        }
    }).catch(err => {
        console.error(err);

        res.status(400).send();
    });
});

/* READ */

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

/* UPDATE */

router.put('/:id', async (req, res) => {
   const id = req.params.id;

   Article.update(req.body, {where: {id: id}}).then(value => {
       res.status(200).send();
   }).catch(err => {
       console.error(err);

       res.status(400).send();
   });
});

/* DELETE */

router.delete('/:id', async (req, res) => {
    const id = req.params.id;

    let deleted = await Article.destroy({where: {id: id}});

    if (deleted) {
        res.status(200).send({success: true, message: "article with id " + id + " removed"});
    } else {
        res.status(500).send({success: false, message: "wrong article id " + id});
    }
});

module.exports = router;
