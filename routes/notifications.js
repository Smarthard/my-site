const express = require('express');
const router = express.Router();
const sequelize = require('sequelize');
const Op = sequelize.Op;

const ServerError = require('../types/ServerError');
const Notifications  = require('../models').Notification;
const middleware = require("../auth/middleware");

function _parseVersion(version) {
    let [major, minor, patch] = `${version}`.split('.');

    if (!major)
        major = 0;
    if (!minor)
        minor = 0;
    if (!patch)
        patch = 0;

    return [+major, +minor, +patch];
}

async function _createNotification(req, res, next) {
    const info = req.body.info;
    const expires = req.body.expires ? new Date(Date.parse(req.body.expires)) : null;
    const minVersion = req.body.minVersion ? _parseVersion(req.body.minVersion) : null;
    const maxVersion = req.body.maxVersion ? _parseVersion(req.body.maxVersion) : null;
    let newNotification;

    if (!info || !info.name || !info.html) {
        return next(new ServerError('Required parameter "info" missing', 'Invalid required parameter', 400));
    }

    try {
        newNotification = await Notifications.create({ info, expires, min_version: minVersion, max_version: maxVersion });
    } catch (e) {
        return next(new ServerError('Cannot insert new record', 'Internal Error', 500));
    }

    return res.status(201).send(newNotification);
}

router.post('/', middleware.allowFor('admin'), (req, res, next) => {
    return _createNotification(req, res, next);
});

router.get('/', async (req, res, next) => {
    const targetVersion = req.query.version ? _parseVersion(req.query.version) : null;
    const date = new Date();
    let notifications;
    let where = {
        [Op.and]: [
            {
                createdAt: { [Op.lt]: date }
            },
            {
                [Op.or]: [
                    { expires: { [Op.gt]: date } },
                    { expires: null }
                ]
            }
        ]
    };

    if (targetVersion) {
        where[Op.and].push([
            {
                [Op.or]: [
                    { min_version: { [Op.lte]: sequelize.cast(targetVersion, 'int[]') } },
                    { min_version: null }
                ]
            },
            {
                [Op.or]: [
                    { max_version: { [Op.gte]: sequelize.cast(targetVersion, 'int[]') } },
                    { max_version: null }
                ]
            }
        ])
    }

    try {
        notifications = await Notifications.findAll({ where });

        notifications = notifications.map((v) => {
            if (v && v.min_version)
                v.min_version = v.min_version.join('.');
            if (v && v.max_version)
                v.max_version = v.max_version.join('.');

            return v;
        })
    } catch (e) {
        return next(new ServerError('Probably invalid version was set', 'Cannot process your request', 400));
    }

    res.status(200).send(notifications);
});

router.get('/:id', async (req, res, next) => {
    const id = req.params.id;
    let notification;

    if (isNaN(id)) {
        return next(new ServerError('Request id should be a number', 'Invalid required parameter', 400));
    }

    try {
        notification = await Notifications.findOne({ where: { id }});
    } catch (e) {
        return next(new ServerError('Cannot process your request', 'Internal Error', 500));
    }

    res.status(200).send(notification);
});

module.exports = router;
