let express = require('express');
let router = express.Router();

/* GET home page. */
router.get('/', (req, res) => {
  res.send({msg: "ok"});
});

module.exports = router;
