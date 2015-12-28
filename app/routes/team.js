var express = require('express');
var router = express.Router();
var Team = require('../models/team'),
    User = require('../models/user'),
    Activity = require('../models/activity'),
    Call = require('../models/call');

// Start of Index
// * get current user's team, otherwise, go to homepage
router.get('/:teamname', function(req, res, next) {
    //1 - get Team target
    Team
      .findOne({ name: req.params.teamname })
      .populate('mentor members')
      .exec(function(err, team) {
        if (err) throw err;

        req.team = team;
        next();
        // next();
      });
  })
  .get('/:teamname', function(req, res, next) {
      // 2 - Get activities
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
      req.calls.weekly = JSON.stringify(calls);
      next();
    });
  })
  .get('/:teamname', function(req, res, next) {
    var team = req.team;
    Call.getCallsThisMonth(team, function(err, calls) {

      //Prep for C3 use

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
        calls: req.calls
      }
    );

  });
// End of index

module.exports = router;
