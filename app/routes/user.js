var express = require('express'),
    passport = require('passport'),
    bcrypt = require('bcrypt-nodejs'),
    numeral = require('numeral');
var router = express.Router();

var User = require('../models/user'),
    Activity = require('../models/activity'),
    Call = require('../models/call');

// Upload image to s3

var Upload = require('s3-uploader');

var multer  = require('multer')
var uploader = multer({ dest: '/tmp' })

var s3UserClient = new Upload('www.phonebankduel.com', {
                aws: {
                  path: 'user/',
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
    if ( req.user ) {
      res.redirect('/');
    } else {
      // If there's no session, go to registration page
      res.render('user/register');
    }
  })
  .post(function(req,res,next) {
    // Render Registration page from here
    var userParam = req.body.user;

    //1 . Check if user exists
    var query = User.find();
    query.or([{email: userParam.email}, {username: userParam.username}]);

    query.exec(function(err, users) {
      if (users.length) {
        if (users[0].password != '' && users[0].email == userParam.email) {
          req.flash('error','Sorry, email is already used.');
          res.redirect('/user/register');
        } else if (users[0].password != '' && users[0].username == userParam.username){
          req.flash('error','Sorry, username is already used.');
          res.redirect('/user/register');
        }
        else if (users[0]['email'] == userParam.email && users[0].password == '') {
          req.existing = users[0];
          next();
        } else {
          req.flash('error','Sorry, username is already used.');
          res.redirect('/user/register');
          res.end();
        }
      } else {
        next();
      }
      // next();
    });
  })
  .post(function(req, res, next) {
    //2. Save Iser!
    var newUser = new User(req.body.user);
    // newUser.password = req.body.user.password;

    if (req.existing) {
      newUser._id = req.existing._id;
    }

    console.log("XYXYXYX", newUser);

    req.user = newUser;
    if (req.existing) {
      req.existing.remove(function(err) {
        newUser.save(function(err) {
          if (err) {
            console.log("ERRRORRRR ::: ", err);
            if (err.errors.password) {
              req.flash("error", "Error: " + err.errors.password.message);
            }
            res.redirect('/user/register');
            res.end();
          } else {
            next();
          }
        });
      });
    } else {
      newUser.save(function(err) {
        if (err) {
          console.log("ERRRORRRR ::: ", err);
          if (err.errors.password) {
            req.flash("error", "Error: " + err.errors.password.message);
          }
          res.redirect('/user/register');
          res.end();
        } else {
          next();
        }
      });
    }

  })
  .post(function(req,res,next) {
    //3. Send confirmation email
    var user = req.user;

    var registrationCode = user.createRegistrationCode();
    console.log(registrationCode);
    req.flash("info", "Registration Successful! Please login.");
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

//Create edit page
router.route(/edit(\/:type)?/)
  .get(function(req, res, next) {
    var target_user = req.user;

    console.log("X!X!X!", req.user, typeof req.user, req.user instanceof User);

    if (!target_user) {
      res.render('user/login');
    } else {
      User.findOne({ username: req.user.username })
        .populate('team')
        .exec(function(err, user) {
          res.render('user/edit', {
            layout: "settings", user: user, currentPage: req.url })
        });
    }
  });

router.post("/edit", function(req, res, next) {
    //Profile change
    var _user = req.body.user;

    req.user.username = _user.username;
    req.user.name = _user.name;

    User.findByIdAndUpdate(
      req.user._id,
      { $set: {
        username: _user.username,
        name: _user.name
      } },
      function(err) {
        if (err) throw err;
        req.flash('info', 'User Profile Updated');
        res.redirect('/user/edit');
      }
    );
});

router.post("/edit/photo", uploader.single('photo'), function(req, res, next) {
  console.log("XXAAAAA",req.file);

  if ( ["image/png", "image/jpg", "image/jpeg", "image/gif"].indexOf(req.file.mimetype) < 0) {
    req.flash('error', 'Wrong filesize. Please use an image.');
    res.redirect('/user/edit/photo');
  } else {
      s3UserClient.upload(req.file.path, {}, function(err, versions, meta) {
        if (err) { throw err; }

        req.user.photo = versions[0].url;
        req.user.save(function(err) {
          req.flash('info', 'Photo Updated successfully.');
          res.redirect('/user/edit/photo');
        });
      });
  }

});

router.post("/edit/password", function(req, res, next) {
  var _user = req.body.user;

  if ( _user.new_password != _user.repeat_password ) {
    req.flash("error", "New password does not match.");
    res.redirect('/user/edit/password');
    next();
  } else {
    User.findById(req.user._id, function(err, user) {
      user.validPassword(_user.old_password, function(err, isMatch) {
        bcrypt.hash(_user.new_password, null, null, function(err, hash) {
          req.user.password = hash;
          User.findByIdAndUpdate(user._id, {$set: { password: hash }},
            function(err) {
              if (err) throw err;
              req.flash('info', 'Password successfully changed');
              res.redirect('/user/edit/password');
            });
        });
      });
    });
  }
});

router.post('/edit/fundraising', function(req, res, next) {

  var fundraising_link = req.body.user.meta.fundraising_link;

  if ( fundraising_link.match(/^https:\/\/secure\.berniesanders\.com\/page\/outreach\/view\/grassroots\-fundraising\//)
      || fundraising_link.match(/^https:\/\/secure\.actblue\.com\/contribute\/page\//)
      || fundraising_link == ""
     ) {
            // get session
            var user = req.user;
            user.meta.fundraising_link = fundraising_link;
            console.log("Saving fundraiser", user, typeof user);
            user.save(function(err) {
              if (err) throw err;

              req.flash('info', 'Fundraising link updated');
              res.redirect('/user/edit/fundraising');

            });

       } else {
          req.flash('error', "Invalid Fundraising Link. Please use actblue or the <a href='https://secure.berniesanders.com/page/outreach/dashboard/grassroots-fundraising/' target='_blank'>Personal Fundraising page</a>");
          res.redirect('/user/edit/fundraising');
       }
});


router.get('/u/:id', function(req, res, next) {
  User.findById(req.params.id, function(err, user) {
    if (err) throw err;
    req.url = '/' + user.username;
    next('route');
  });
});
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
        console.log(user);
        Activity
            .find({users_involved: user._id })
            .populate('users_involved')
            .sort({ 'activity_date': -1 })
            .exec(function(err, activities) {
              req.activities = activities;
              next();
            });
      })
      .get('/:username', function(req, res, next) {
        // 3 - Get weekly calls and render it properly
        var user = req.user;
        req.calls = {};

        Call.getCallsThisWeek(user, function(err, calls) {
          var total = 0;
          for (var i = 0; i < calls.length; i ++ ) {
            total += calls[i].count;
          }
          console.log(total);
          req.calls.weeklyCount =
            total < 10000 ? total : numeral(total).format('0.0a').replace(".0", "");
          req.calls.weekly = JSON.stringify(calls);
          next();
        });
      })
      .get('/:username', function(req, res, next) {
        var user = req.user;
        Call.getCallsThisMonth(user, function(err, calls) {

          var total = 0;
          for (var i = 0; i < calls.length; i ++ ) {
            total += calls[i].count;
          }
          //Prep for C3 use
          req.calls.monthlyCount =
            total < 10000 ? total : numeral(total).format('0.0a').replace(".0", "");
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
