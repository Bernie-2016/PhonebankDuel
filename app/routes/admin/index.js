var express = require('express');
var router = express.Router();

var userAdmin = require('./users');
var teamAdmin = require('./teams');
var gameAdmin = require('./games');

router.use('/users', userAdmin);
router.use('/teams', teamAdmin);
router.use('/games', gameAdmin);

router.use('/', function(req, res, next) {
  //Check if user is admin
  res.send('Admin Index');
});

// catch 404 and forward to error handler
router.use(function(req, res, next) {
  console.log("!!!!! Testing not found");

  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

module.exports = router;

