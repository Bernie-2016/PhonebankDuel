var express = require('express'),
    passport = require('passport');
var router = express.Router();

var User = require('../models/user'),
    Activity = require('../models/activity'),
    Call = require('../models/call');

//Start of login
router.route('/login')
  .get(function(req, res, next) {
    //render page for Login

    //Render login page
    res.render('user/login');
  });
//End of login

/***
  *
  * START of registration
  */
router.route('/register')
  .get(function(req,res,next) {
    // Check if user is already logged in first!
    //Render registration page here

    // If there's no session, go to registration page
    res.render('user/register');
  })
  .post(function(req,res,next) {
    // Render Registration page from here
    var userParam = req.body.user;

    //1 . Check if user exists
    console.log(userParam);
    var query = User.find();

    query.or([{email: userParam.email}, {username: userParam.username}]);

    query.exec(function(err, users) {
      if (users.length) {
        req.flash('error','Sorry. User is already registered.');
        res.redirect('/user/register');
        res.end();
      } else {
        next();
      }
      // next();
    });
  })
  .post(function(req, res, next) {
    //2. Save Iser!
    var newUser = User(req.body.user);
    req.user = newUser;
    newUser.save(function(err) {
      if (err) {
        if (err.errors.password) {
          req.flash("error", "Error: " + err.errors.password.message);
        }
        res.redirect('/user/register');
        res.end();
      } else {
        next();
      }
    });
  })
  .post(function(req,res,next) {
    //3. Send confirmation email
    var user = req.user;

    var registrationCode = user.createRegistrationCode();
    console.log(registrationCode);
    req.flash("info", "Registration Successful! Please check email to confirm");
    res.redirect('/');

  });
//end of registration

// // Start of Index - Personal user page OR go back homepage
// router.use('/', function(req, res, next) {
//   if (req.user) {
//     req.url = '/user/' + req.user.username;
//     next('route');
//   } else {
//     console.log("XXX");
//     res.render('user/login');
//   }

//   // res.render('user', {layout: "profile-layout", name: "Rapi Castillo"});
// })
// End of index

//Start of user page
router.get('/:username', function(req,res,next) {
        // 1 - retrieve user
        User
          .findOne({ username: req.params.username })
          .populate('team')
          .exec(function(err, user) {
            if (err) throw err;
            req.user = user;
            next();
          });
      })
      .get('/:username', function(req, res, next) {
        // 2 - Get activities
        console.log("Activity");
        var user= req.user;
        console.log(user._id);
        Activity
            .find({users_involved: user._id })
            .populate('users_involved')
            .sort({ 'activity_date': -1 })
            .exec(function(err, activities) {
              req.activities = activities;
              console.log("XXX", activities);
              next();
            });
      })
      .get('/:username', function(req, res, next) {
        // 3 - Get weekly calls and render it properly
        var user = req.user;
        req.calls = {};

        Call.getCallsThisWeek(user, function(err, calls) {
          req.calls.weekly = JSON.stringify(calls);
          next();
        });
      })
      .get('/:username', function(req, res, next) {
        var user = req.user;
        Call.getCallsThisMonth(user, function(err, calls) {

          //Prep for C3 use

          req.calls.monthly = JSON.stringify(calls);
          next();
        });
      })
      .get('/:username', function(req, res, next) {
        // 4 - Render user page
        console.log(req.activities);
        res.render('user',
          {
            layout: "profile-layout",
            user: req.user,
            activities: req.activities,
            calls: req.calls
          }
        );

      });
//End of userpage


module.exports = router;
