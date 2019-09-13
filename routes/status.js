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

/**
 * @swagger
 *
 * /api/status:
 *  get:
 *      summary: Check out online status of the server and API
 *      description: Get server and API statuses
 *      tags:
 *          - Status
 *      produces:
 *          - application/json
 *      responses:
 *          200:
 *              description: Server is up, API status - see in response
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/StatusResponse'
 *          504:
 *              description: Server probably offline
 */
router.get('/', (req, res) => {
    res.status(200).send({
       server: server_status,
       api: api_status,
   });
});

/**
 * @swagger
 *
 * /api/status/uptime:
 *  get:
 *      summary: Uptime of the server and API
 *      description: Get server and API uptime (available only on API online)
 *      tags:
 *          - Status
 *      produces:
 *          - application/json
 *      responses:
 *          200:
 *              description: Server uptime, API uptime
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/StatusUptimeResponse'
 *          504:
 *              description: Server probably offline
 */
router.get('/uptime', (req, res) => {
    res.status(200).send({
        server: duration(os.uptime()),
        api: duration(process.uptime())
    });
});

module.exports = router;
