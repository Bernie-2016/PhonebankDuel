var express = require('express');
var router = express.Router();

//Models...
var Call = require('../models/call');
var numeral = require('numeral');

// Start of Index - Personal user page OR go back homepage
// router.use('/', function(req, res, next) {
//   res.render('rank', {type: "caller", time: "overall"});
//})

/* Team Rankings */
router.get('/team', function(req,res,next) {
  // GET Weekly Ranking
  Call.getTopTeamThisWeek(function(err, ranking) {
    while ( ranking.length < 10 ) { ranking.push({_id: { team : { name: null }}, count: null}); }

    req.weekly = ranking;
    next();
  });
}).get('/team', function(req, res, next) {
  // GET Overall Ranking!
  Call.getTopTeamOverall(function(err, ranking) {
    while ( ranking.length < 10 ) { ranking.push({_id: { team : { name: null }}, count: null}); }
    req.overall = ranking;
    next();
  });
}).get('/team', function(req, res, next) {
  // Render
  console.log(req.overall);
  console.log(req.weekly);
  res.render("rank/team", {
        layout: "rank-layout",
        type: "team",
        overallRanking: req.overall,
        weeklyRanking: req.weekly });
})

/* Personal Rankings*/
router.get('/caller', function(req,res,next) {
  // GET Weekly Ranking
  Call.getTopUserThisWeek(function(err, ranking) {
    while ( ranking.length < 10 ) { ranking.push({_id: { user : { username: null }}, count: null}); }
    req.weekly = ranking;
    next();
  });
}).get('/caller', function(req, res, next) {
  // GET Overall Ranking!
  Call.getTopUserOverall(function(err, ranking) {
    while ( ranking.length < 10 ) { ranking.push({_id: { user : { username: null }}, count: null}); }
    req.overall = ranking;
    next();
  });
}).get('/caller', function(req, res, next) {
  // Render
  res.render("rank/caller", {
        layout: "rank-layout",
        type: "caller",
        overallRanking: req.overall,
        weeklyRanking: req.weekly });
})
// End of index

module.exports = router;
