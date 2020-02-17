const axios = require('axios');
const express = require('express');
const router = express.Router();
const ServerError = require('../types/ServerError');

const KODIK_API = 'https://kodikapi.com';
const KODIK_TOKEN = process.env.KODIK_TOKEN || '';

function buildKodikParams(req) {
    const title = req.query.title;
    const strict = req.query.strict;
    const limit = req.query.limit;
    const types = req.query.types;
    const season = req.query.season;
    const episode = req.query.episode;
    const params = {
        token: KODIK_TOKEN,
        title, types
    };

    if (strict) {
        params.strict = strict;
    }

    if (limit) {
        params.limit = limit;
    }

    if (season) {
        params.season = season;
    }

    if (episode) {
        params.episode = episode;
    }

    return params;
}

router.get('/search', (req, res, next) => {
    const params = buildKodikParams(req);

    if (!params.title || !params.types) {
        return next(new ServerError('Required parameters missing', 'Invalid required parameter', 400));
    }


    axios.get(`${KODIK_API}/search`, { params })
        .then(res => res.data)
        .then(kodikRes => res.send(kodikRes))
        .catch(err => next(err));
});

module.exports = router;
