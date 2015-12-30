var express = require('express');
var router = express.Router();
var Team = require('../models/team'),
    User = require('../models/user'),
    Activity = require('../models/activity'),
    Call = require('../models/call');

// Start of Index
router.get('/', function(req, res, next) {
  if (req.user) { // logged in
    Team.findById(req.user.team, function(err, team) {
      req.url = '/' + team.name;
      next('route');
    })
  } else {
    res.redirect('/');
  }

});

// * get current user's team, otherwise, go to homepage
router.get('/:teamname', function(req, res, next) {
    //1 - get Team target
    Team
      .findOne({ name: req.params.teamname })
      .populate('mentor')
      .exec(function(err, team) {
        if (err) throw err;

        req.team = team;
        next();
        // next();
      });
  })
  .get('/:teamname', function(req, res, next) {
      // 2 - Get members
      var team = req.team;
      User.
        find({
          team: team._id
        }).exec(function(err, users) {
          req.members = users;
          next();
        });
  })
  .get('/:teamname', function(req, res, next) {
      // 3 - Get activities
      var team= req.team;
      Activity
          .find({teams_involved: team._id })
          .populate('teams_involved users_involved')
          .sort({ 'activity_date': -1 })
          .exec(function(err, activities) {
            req.activities = activities;
            next();
          });
  })
  .get('/:teamname', function(req, res, next) {
    // 3 - Get weekly calls and render it properly
    var team = req.team;
    req.calls = {};

    Call.getCallsThisWeek(team, function(err, calls) {

      var total = 0;
      for (var i = 0; i < calls.length; i ++ ) {
        total += calls[i].count;
      }
      req.calls.weeklyCount =
        total < 10000 ? total : numeral(total).format('0.0a').replace(".0", "");


      req.calls.weekly = JSON.stringify(calls);
      next();
    });
  })
  .get('/:teamname', function(req, res, next) {
    var team = req.team;
    Call.getCallsThisMonth(team, function(err, calls) {

      //Prep for C3 use
      var total = 0;
      for (var i = 0; i < calls.length; i ++ ) {
        total += calls[i].count;
      }
      req.calls.monthlyCount =
        total < 10000 ? total : numeral(total).format('0.0a').replace(".0", "");

      req.calls.monthly = JSON.stringify(calls);
      next();
    });
  })
  .get('/:teamname', function(req, res, next) {
    // 4 - Render user page
    console.log(req.activities);
    res.render('team',
      {
        layout: "profile-layout",
        team: req.team,
        activities: req.activities,
        calls: req.calls,
        members: req.members
      }
    );

  });
// End of index

module.exports = router;
