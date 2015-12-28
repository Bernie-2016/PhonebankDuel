var express = require('express');
var router = express.Router();

router.use('/', function(req, res, next) {
  res.send('Match area');
});

module.exports = router;
