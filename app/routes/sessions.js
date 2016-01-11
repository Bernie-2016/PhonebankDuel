'use strict';
var passport = require('passport');

module.exports = function(router) {
  // router.route('/login')
  //       .post(passport.authenticate('local', { successRedirect: '/',
  //                                          failureRedirect: '/user/login',
  //                                          failureFlash: true }));

//Made a custom fiunction for login to include report_in option
router.post('/login', function (req, res, next) {
    passport.authenticate('local', function (err, user, info) {
        if (err) {
            return next(err)
        } else if (!user) {
            req.flash('error', info.message);
            return res.redirect('/user/login')
        } else {
            req.logIn(user, function (err) {
                if (err) {
                    return next(err);
                }
                if (req.body.report_in) {
                  return res.redirect('/?report_in=true');
                } else {
                  return res.redirect('/');
                }
            });
        }
    })(req, res, next);
});


  router.route('/logout')
        .get(function(req, res, next) {
          req.logout();
          res.redirect('/');
        });
};
