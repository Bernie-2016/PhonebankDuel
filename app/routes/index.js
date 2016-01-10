var express = require('express');
var router = express.Router();

var userPage = require('./user');
var teamPage = require('./team');
var matchPage = require('./match');
var commandCenter = require('./commandcenter');
var rankPage = require('./rank');
var callServices = require('./call');


var User = require('../models/user');
var Team = require('../models/team');

/* GET home page. */
router.get('/', function(req, res, next) {
  // If the user has not logged in
  console.log("RAPI ::::: ", req.user);
  if ( !req.user ) {
    res.render('user/login');
  } else {
    //Otherwise go to userpage
    req.url = '/user/' + req.user.username;
    next('route');
  }
});


router.get('/t/:id', function(req, res, next) {
  Team.findOne({ _id: req.params.id }, function(err, team) {
    req.url = '/team/' + team.name;
    next('route');
  });
});

router.get("/j/:team_id?", function(req, res, next) {
  if (req.params.team_id) {
    req.url = "/user/register/" + req.params.team_id;
    next('route');
  } else {
    req.url = "/user/register";
    next('route');
  }
});

// Add Session Routes
require('./sessions')(router);

// Defining Routes
router.use('/user', userPage);
router.use('/team', teamPage);
router.use('/match', matchPage);
router.use('/cc', commandCenter);
router.use('/rank', rankPage);
router.use('/call', callServices);

module.exports = router;
