const ServerError = require('../types/ServerError');
const Request  = require('../models').Request;
const ShikiVideos = require('../models').ShikiVideos;
const Article  = require('../models').Article;
const express = require('express');
const router = express.Router();
const middleware = require("../auth/middleware");

async function _reviewRequest(req, res, next, approved) {
    const id = req.params.id;
    const reviewer_id = req.session.user.id;
    const feedback = req.body.feedback;
    const reviewed = new Date();
    let patchRequest;

    if (isNaN(id)) {
        return next(new ServerError('Request id should be a number', 'Invalid required parameter', 400));
    }

    try {
        patchRequest = await Request
            .update({ approved, reviewer_id, feedback, reviewed }, { where: { id } })
            .then(() => Request.findOne({ where: { id }}));

        if (approved) {
            const request = patchRequest.request;
            const where = { id: patchRequest.target_id };

            switch (patchRequest.type) {
                case 'articles':
                    Article.update(request, { where });
                    break;
                case 'shikivideos':
                    ShikiVideos.update(request, { where });
                    break;
                case 'shikivideos_delete':
                    ShikiVideos.destroy({ where });
                    break;
            }
        }
    } catch (e) {
        return next(new ServerError('Cannot update record', 'Internal Error', 500))
    }

    return res.status(200).send(patchRequest);
}

async function _createRequest(req, res, next) {
    const type = req.query.type;
    const target_id = req.query.target_id || null;
    const request = req.body.request;
    const comment = req.body.comment;
    let requester = req.body.requester;
    let old;
    let newRequest;

    if (!type || !requester || !request) {
        return next(new ServerError('Required parameters missing', 'Invalid required parameter', 400));
    }

    if (req.session.user && req.session.user.id) {
        requester = req.session.user.id;
    }

    try {
        switch (type) {
            case 'articles':
                old = await Article.findOne({ where: { id: target_id }});
                break;
            case 'shikivideos':
                old = await ShikiVideos.findOne({ where: { id: target_id }});
                break;
        }
        newRequest = await Request.create({ type, target_id, requester, request, old, comment });
    } catch (e) {
        return next(new ServerError('Cannot insert new record', 'Internal Error', 500));
    }

    return res.status(201).send(newRequest);
}

function _checkRequester() {
    return (req, res, next) => {
        if (isNaN(req.body.requester)) {
            return _createRequest(req, res, next);
        } else {
            next();
        }
    }
}

router.post('/', _checkRequester(), middleware.allowFor('user', 'admin'), (req, res, next) => {
    return _createRequest(req, res, next);
});

router.get('/', async (req, res, next) => {
    const offset = req.query.offset;
    const limit = req.query.limit;
    let requests;
    try {
        requests = await Request.findAll({ limit, offset });
    } catch (e) {
        return next(new ServerError('Cannot process your request', 'Internal Error', 500));
    }

    res.status(200).send(requests);
});

router.get('/:id', async (req, res, next) => {
    const id = req.params.id;
    let request;

    if (isNaN(id)) {
        return next(new ServerError('Request id should be a number', 'Invalid required parameter', 400));
    }

    try {
        request = await Request.findOne({ where: { id }});
    } catch (e) {
        return next(new ServerError('Cannot process your request', 'Internal Error', 500));
    }

    res.status(200).send(request);
});

router.post(
    '/:id/approve',
    middleware.allowFor('admin'),
    (req, res, next) => _reviewRequest(req, res, next, true)
);

router.post(
    '/:id/reject',
    middleware.allowFor('admin'),
    (req, res, next) => _reviewRequest(req, res, next, false)
);

router.post(
    '/:id/revert',
    middleware.allowFor('admin'),
    async (req, res, next) => {
        const id = req.params.id;

        try {
            const request = await Request.findOne({ where: { id }});
            let model;

            switch (request.type) {
                case 'articles':
                    model = Article;
                    break;
                case 'shikivideos':
                    model = ShikiVideos;
                    break;
                default:
                    return next();
            }

            model.update(request.old, { where: { id: request.target_id }});
        } catch (e) {
            return next(new ServerError('Cannot process your request', 'Internal Error', 500));
        }

        next();
    },
    (req, res, next) => _reviewRequest(req, res, next, false));

module.exports = router;
