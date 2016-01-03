var Team = require('../../models/team.js');
var Call = require('../../models/call.js');
var User = require('../../models/user.js');
var Activity = require('../../models/activity.js');
var express = require('express');
var Upload = require('s3-uploader');
var multer  = require('multer');
var uploader = multer({ dest: '/tmp' });
var s3TeamClient = new Upload('www.phonebankduel.com', {
                aws: {
                  path: 'team/',
                  region: 'us-east-1',
                  acl: 'public-read'
                },
                cleanup: {
                  versions: true,
                  original: false
                },
                original: {
                  awsImageAcl: 'private'
                },
                versions: [{
                  maxHeight: 100,
                  aspect: '1:1',
                  format: 'png',
                  suffix: '-thumb1'
                }]
              });


var _getTeam = function(req, res, next) {
      var user = req.user;
      if ( !user ) {
        res.redirect('/');
      }
      Team.findOne({ mentor: user._id },
        function(err, team) {
          if (err) {
            req.flash('error', err.message);
            res.redirect('back');
          }

          console.log("YTUIRJEIT", team);
          req._team = team;
          next();
        });
    }; // Sets req._team to the team

module.exports = {
  joinTeam: [

    function(req, res, next) {
      var _team = req._team;
      var _id = req.body.team._id;
      var user = req.user;

      if ( _team && _team._id.toString() != _id) {
        req.flash('error', 'You are mentoring Team ' + _team.name);
        res.redirect('back');
      }
      else if ( user.team  && user.team.toString() == _id ) { // user has team
        req.flash('error', 'You have already joined a team');
        res.redirect('back');
      } else if ( !user.team || (user.team.toString() != _id) ) {
        req.user.team = _id;
        req.user.save(function(err, user) {
          if (err) {
            req.flash('err'. err.message);
            res.redirect('back');
          }

          //Get team info
          Team.findOne({ _id: _id }, function(err, team) {
            req.flash('info', 'You have joined Team <a href="/team/' + team.name + '">' +  team.name + '</a>. All your points from here on out will be added to this team.');
            res.redirect('back');
          });

        });
      }
    }
  ],
  leaveTeam: [
    _getTeam,
    function(req, res, next) {
      var _team = req._team;
      var _id = req.body.team._id;
      var user = req.user;

      console.log("~~~~~~~~", _team, req._team)
      if ( user.team && (user.team && user.team.toString() != _id) ) {

        req.flash('error', 'You are not a member.');
        res.redirect('back');
      } else if (_team && _team._id.toString() == _id && _team.mentor.equals(user._id) ) {
        req.flash('error', 'You cannot leave a team you are mentoring');
        res.redirect('back');
      } else if ( user.team  && user.team.toString() == _id ) { // user has team
        req.user.team = null;
        req.user.save(function(err, user) {
          if (err) {
            req.flash('err'. err.message);
            res.redirect('back');
          }

          //Get team info
          Team.findOne({ _id: _id }, function(err, team) {
            req.flash('info', 'You have left Team <a href="/team/' + team.name + '">' +  team.name + '</a>.');
            res.redirect('back');
          });

        });
      }
    }

  ],
  changeLogo: [
    _getTeam,
    function(req, res, next) {
      //store image
      var _team = req._team;
      if (!req.user) { res.redirect('/user/login'); }
      if (req.file) {
        if ( ["image/png", "image/jpg", "image/jpeg", "image/gif"].indexOf(req.file.mimetype) < 0) {
          req.flash('error', 'Wrong filesize. Please use an image.');
          res.redirect('/user/edit/photo');
        } else {
            s3TeamClient.upload(req.file.path, {}, function(err, versions, meta) {
              if (err) { throw err; }

              var photo = versions[0].url;

              _team.logo = photo;
              _team.save(function(err) {
                if (err) {
                  req.flash('error', err.message);
                  res.redirect('/team/edit/logo');
                } else {
                  req.flash('info', "Logo updated.");
                  res.redirect('/team/edit/logo');
                }
              });
              // req.user.save(function(err) {
                // if (err) throw err;

                // next();
                // req.flash('info', 'Photo Updated successfully.');
                // res.redirect('/user/edit/photo');
              // });
            });
        }
      }
    }
  ],
  updateFundraising: [
    _getTeam, // 1st get team
    function(req, res, next) {
      var _team = req._team;
      var user = req.user;

      var fundraising_link = req.body.team.fundraising_link;
      _team.fundraising_link = fundraising_link;

      // console.log(_team);
      _team.save(function(err) {
        if (err) {
          req.flash('error', err.message);
          res.redirect('/team/edit/fundraising');
        } else {
          req.flash('info', "Fundraising link updated.");
          res.redirect('/team/edit/fundraising');
        }
      });
    }
  ],
  edit: [
    //1st - get team
    _getTeam,
    function(req, res, next) {
      //2nd - save team
      var user = req.user;
      var _team = req._team;

      var name = req.body.team.name;
      var description = req.body.team.description;

      _team.name = name;
      _team.description = description;

      _team.save(function(err) {
        if (err) {
          req.flash('error', err.message);
          res.redirect('/team/edit');
        } else {
          req.flash('info', "Team profile updated");
          res.redirect('/team/edit');
        }
      });
    }
  ],
  showTeam: [
  function(req, res, next) {
    //1 - get Team target
    Team
      .findOne({ name: req.params.teamname })
      .populate('mentor')
      .exec(function(err, team) {
        if (err) throw err;

        if (team) {
          req.team = team;
          next();
        } else {
          req.url = '/join';
          next('route');
        }
        // next();
      });
  },
  function(req, res, next) {
      // 2 - Get members
      var team = req.team;
      User.
        find({
          team: team._id
        }).exec(function(err, users) {
          req.members = users;
          next();
        });
  },
  function(req, res, next) {
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
  },
  function(req, res, next) {
    // 3 - Get weekly calls and render it properly
    var team = req.team;
    req.calls = {};

    Call.getCallsThisWeek(team, function(err, calls) {

      var total = 0;
      for (var i = 0; i < calls.length; i ++ ) {
        total += calls[i].count;
        total += calls[i].texts;
      }
      req.calls.weeklyCount =
        total < 10000 ? total : numeral(total).format('0.0a').replace(".0", "");


      req.calls.weekly = JSON.stringify(calls);
      next();
    });
  },
  function(req, res, next) {
    //Retreive calls for the month
    var team = req.team;
    Call.getCallsThisMonth(team, function(err, calls) {

      //Prep for C3 use
      var total = 0;
      for (var i = 0; i < calls.length; i ++ ) {
        total += calls[i].count;
        total += calls[i].texts;
      }
      req.calls.monthlyCount =
        total < 10000 ? total : numeral(total).format('0.0a').replace(".0", "");

      req.calls.monthly = JSON.stringify(calls);
      next();
    });
  },
  function(req, res, next) {
    // 4 - Render user page
    // console.log(req.activities);
    var user = req.user;
    res.render('team',
      {
        layout: "profile-layout",
        team: req.team,
        activities: req.activities,
        calls: req.calls,
        members: req.members,
        user: user
      }
    );

  }
  ]
};
