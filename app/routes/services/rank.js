var Call = require('../../models/call');
var Team = require('../../models/team');
var numeral = require('numeral');

var RankServices = {};

/***
 *  Get ranking by team/
 *  /team(/:timeline)?l=<LEAGUE>
 ***/
RankServices.teamRanking = [
  //1 - get teams
  function(req, res, next) {
    var league = req.query.l ? req.query.l : null;
    // console.log(league, req.query);

    if ( !league ) {
      next();
    } else {
      Team.find({league: league}, {_id: 1}, function(err, teams ) {
        req.teams = teams;
        next();
      });
    }
  }
  ,
  // Get ranking
  function(req, res, next) {
    var teams = req.teams ? req.teams : null;
    var timeline = req.params.timeline ? req.params.timeline : 'daily';
    Call.getTopTeams(timeline, teams, function(err, ranking) {
      req.ranking = ranking;
      next();
    });
  },
  //3 - Render
  function (req, res, next) {
    var ranking = req.ranking;
    res.render("rank/team", {
        layout: "rank-layout",
        type: "team",
        league: req.query.l,
        timeline: req.params.timeline ? req.params.timeline : 'daily',
        max: (ranking.length ? ranking[0].count : 0),
        ranking: ranking.map (function(r) {
          if (r.count >= 10000) {
            r.countText = numeral(r.count).format("0.0a")
          } else if (r.count < 1000) {
            r.countText = r.count;
          } else {
            r.countText = numeral(r.count).format('0,0');
          }
          return r;}
        )
    });
  }
];


/***
 *  Get Ranking by Caller
 *  /caller(/:timeline)?l=<LEAGUE>
 ***/
RankServices.callerRanking = [
  // 1 - get all caller information
  function(req,res,next) {
    var timeline = req.params.timeline;
    Call.getTopUsers(timeline, function(err, ranking) {

      req.ranking = ranking;

      next();
    });
  },

  // 2 render
  function(req, res, next) {
    var ranking = req.ranking;

    ranking.map(function(r) {
        if (r.count >= 10000) {
          r.countText = numeral(r.count).format("0.0a")
        } else if (r.count < 1000) {
          r.countText = r.count;
        } else {
          r.countText = numeral(r.count).format('0,0');
        }
        return r;
    });

    console.log(ranking);

    var timeline = req.params.timeline ? req.params.timeline : 'daily';

    res.render("rank/caller", {
        layout: "rank-layout",
        timeline: timeline,
        type: "caller",
        ranking: ranking,
        max: (req.ranking.length ? req.ranking[0].count : 0) });
  }
];

module.exports = RankServices;
