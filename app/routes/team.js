var express = require('express');
var router = express.Router();
var Team = require('../models/team'),
    User = require('../models/user'),
    Activity = require('../models/activity'),
    Call = require('../models/call');

var Upload = require('s3-uploader');
var multer  = require('multer');
var uploader = multer({ dest: '/tmp' });
var TeamServices = require('./services/team-services.js');
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
    if (req.user.team) { // if user has a team
      Team.findById(req.user.team, function(err, team) {
        req.url = '/' + team.name;
        next('route');
      });
    } else {
      req.url = '/join';
      next('route');
    }
  } else {
    res.redirect('/');
  }

});

router.get('/join', function(req,res,next) {

  // console.log(req.query);
  var page = req.query.p || 0;

  Team.find({})
    .limit(20).skip(page*20)
    .exec(function(err, teams) {
      if (err) throw err;
      res.render('team/list', {layout: 'settings', teams: teams, user: req.user, currentPage: req.url });
    });

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
        res.render('team/create', { layout: "settings", currentPage: req.url });
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
            // req.user.save(function(err) {
              // if (err) throw err;

              next();
              // req.flash('info', 'Photo Updated successfully.');
              // res.redirect('/user/edit/photo');
            // });
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
  var description = req.body.team.description;
  var fundraising_link = req.body.team.fundraising_link;
  var user = req.user;

  var team = Team({ name: name, mentor: user._id, fundraising_link: fundraising_link, logo: photo, description: description});

  team.save(function(err, team) {

    if (err) {
      req.flash('error', err.message);
      res.redirect('/team/create');
    }

    // console.log("Newly saved team:: ", team);
    req.team = team;

    next();
  });
})
.post('/create', function(req, res, next) {
  // Save team for the user
  req.user.team = req.team._id;
  req.user.save(function(err) {
    if (err) {
      req.flash('error', err.message);
      res.redirect('/team/create');
    }

    res.redirect('/team/' + req.team.name);
  })
});

router.get(/edit(\/:type)?/, function(req, res, next) {
  // Check if user leads a team. If so, view team, otherwise,
  // have the user create a team.
  var user = req.user;

  var _type = req.params.type || "";

  //Check if user is logged in
  if (user) {
    Team.findOne({ mentor: user._id }, function(err, team) {
      if (team) {
        if(_type == "members") {
          // Retrieve members
          User.find({ team: team._id }, function(err, members) {
            res.render('team/edit', { mentor: true, user: user, team: team, members: members, layout: "settings", currentPage: req.url});
          });
        } else {
          res.render('team/edit', { mentor: true, currentPage: req.url, user: user, team: team, layout: "settings"});
        }
      } else if (user.team) {
        Team.findOne({ _id: user.team }, function(err, team) {
          if (err) throw err;

          res.render('team/edit', {
            mentor: false,
            user: user,
            team: team,
            layout: "settings"
          });
        })
      } else {
        res.redirect('/team/join');
      }

    });
  } else {
    res.redirect('/user/login');
  }

});

// TODO: Edit profile and description
router.post('/edit', TeamServices.edit);

// TODO:  Upload new Logo
router.post('/edit/logo', uploader.single('photo'), TeamServices.changeLogo);

// TODO:  Manage members
router.post('/edit/members', function(req, res, next) {});

router.post('/join', TeamServices.joinTeam);

router.post('/leave', TeamServices.leaveTeam);

// TODO:  Edit fundraising links
router.post('/edit/fundraising', TeamServices.updateFundraising);

// * get current user's team, otherwise, go to homepage
router.get('/:teamname', TeamServices.showTeam);
// End of index

module.exports = router;
