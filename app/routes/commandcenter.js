var express = require('express');
var router = express.Router();

router.use('/', function(req, res, next) {
  res.send('Command Center');
});

module.exports = router;
