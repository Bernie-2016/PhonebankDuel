'use strict';

var LocalStrategy = require('passport-local').Strategy;

module.exports = function(passport) {
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(userId, done) {
    console.log("DESERIALIZING ::: ", userId);
    User.findById(userId, function(err, user) {
      done(err, user);
    });
  });

  /**
   * setup Strategies for Passport
   */

  passport.use(new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password'
    },
    function(email, password, done) {
      console.log("Entering LocalStrategy %s -- %s", email, password);
      User.findOne({ email: email })
        // .populate('team')
        .exec(function(err,user) {

        console.log("USER :: ", user);
        if (err) { return done(err); }
        if (!user) {
          return done(null, false, { message: 'Incorrect username.' });
        }

        user.validPassword(password, function(err, isMatch) {
          console.log(err, isMatch);
          if ( !isMatch ) {
            return done(null, false, { message: 'Incorrect password.' });
          } else {
            return done(null, user);
          }
        });

      });
    }
  ));
}
