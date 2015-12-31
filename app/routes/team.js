var express = require('express');
var router = express.Router();
var Team = require('../models/team'),
    User = require('../models/user'),
    Activity = require('../models/activity'),
    Call = require('../models/call');

var Upload = require('s3-uploader');
var multer  = require('multer')
var uploader = multer({ dest: '/tmp' })
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


router.get('/create', function(req, res, next) {
  // Ask the user to create a team, with logo, info, profile name,
  // and member emails

  // Check if user is leading a team, if so, redirect to that team.
  var user = req.user;
  if (user) {
    Team.findOne({ mentor: user._id }, function(err, team) {
      if (err) throw err;
      if (team) { // he is leading a team
        res.redirect('/team/edit');
      } else {
        res.render('team/create', { layout: "settings" });
      }
    });
  } else {
    res.redirect('/user/login');
  }
})
.post('/create', uploader.single('photo'), function(req, res, next) {
    //store image
    if (!req.user) { res.redirect('/user/login'); }
    if (req.file) {
      if ( ["image/png", "image/jpg", "image/jpeg", "image/gif"].indexOf(req.file.mimetype) < 0) {
        req.flash('error', 'Wrong filesize. Please use an image.');
        res.redirect('/user/edit/photo');
      } else {
          s3TeamClient.upload(req.file.path, {}, function(err, versions, meta) {
            if (err) { throw err; }

            req.photo = versions[0].url;
            req.user.save(function(err) {
              if (err) throw err;

              next();
              // req.flash('info', 'Photo Updated successfully.');
              // res.redirect('/user/edit/photo');
            });
          });
      }
    } else {
      next();
    }
})
.post('/create', function(req, res, next) {
  //Save team name and fundraising link...
  if (!req.user) { res.redirect('/user/login'); }
  var photo = req.photo;
  var name = req.body.team.name;
  var fundraising_link = req.body.team.fundraising_link;
  var user = req.user;

  var team = Team({ name: name, mentor: user._id, fundraising_link: fundraising_link, logo: photo});

  team.save(function(err) {
    if (err) {
      req.flash('error', err);
      res.redirect('/team/create');
    }

    res.redirect('/team/' + name);
  });
});

router.get(/edit(\/:type)/, function(req, res, next) {
  // Check if user leads a team. If so, view team, otherwise,
  // have the user create a team.
  var user = req.user;

  //Check if user is logged in
  if (user) {
    Team.findOne({ mentor: user._id }, function(err, team) {
      if(type == "members") {
        // Retrieve members
        User.find({ team: team._id }, function(err, members) {
          res.render('team/edit', { user: user, team: team, members: members, layout: "settings"});
        });
      } else {
        res.render('team/edit', { user: user, team: team, layout: "settings"});
      }

    });
  } else {
    res.redirect('/user/login');
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
