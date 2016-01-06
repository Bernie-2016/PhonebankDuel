'use strict';
var passport = require('passport');

module.exports = function(router) {
  router.route('/login')
        .post(passport.authenticate('local', { successRedirect: '/',
                                           failureRedirect: '/user/login',
                                           failureFlash: true }));

  router.route('/logout')
        .get(function(req, res, next) {
          req.logout();
          res.redirect('/');
        });
};
