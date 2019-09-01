let express = require('express');
let router = express.Router();

let os = require('os');
let moment = require('moment');
let momentDurationFormatSetup = require("moment-duration-format");

let server_status = 'online';
let api_status = 'online';

function duration(uptime) {
    return moment.duration(uptime, 'seconds').format()
}

/* path /api/articles/ */

router.get('/', (req, res) => {
    res.status(200).send({
       server: server_status,
       api: api_status,
   });
});

router.get('/uptime', (req, res) => {
    res.status(200).send({
        server: duration(os.uptime()),
        api: duration(process.uptime())
    });
});

module.exports = router;
