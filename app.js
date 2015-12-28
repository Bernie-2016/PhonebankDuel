var flash = require('express-flash'),
    express = require('express');
var expressSession = require('express-session');
var sassMiddleware = require('node-sass-middleware');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

//
var uristring =
  process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://localhost/HelloMongoose';

  var theport = process.env.PORT || 5000;

//Mongoose
// getting-started.js
var mongoose = require('mongoose');
mongoose.connect(uristring, function (err, res) {
  if (err) {
    console.log ('ERROR connecting to: ' + uristring + '. ' + err);
  } else {
    console.log ('Succeeded connected to: ' + uristring);
  }
});

mongoose.set('debug', true);

//User model
var User = require('./app/models/user');

//Routes
var routes = require('./app/routes/index')
  , admin = require('./app/routes/admin/index');

var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;


var app = express();

//Setup sass middleware
app.use(sassMiddleware({
    /* Options */
    src: path.join(__dirname, 'app/styles'),
    dest: path.join(__dirname, 'public/stylesheets'),
    debug: true,
    outputStyle: 'compressed',
    prefix:  '/stylesheets'  // Where prefix is at <link rel="stylesheets" href="prefix/style.css"/>
}));

// view engine setup
app.set('views', path.join(__dirname, 'app/views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(cookieParser());
app.use(flash());

app.use(express.static(path.join(__dirname, 'public')));

/*
 * Configurations for `passport`
 */
app.use(expressSession({ secret: 'Bernie Sanders 2016' }));
app.use(passport.initialize());
app.use(passport.session());

/**
 * setup Strategies for Passport
 */
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  },
  function(email, password, done) {
    console.log("Entering LocalStrategy %s -- %s", email, password);
    User.findOne({ email: email })
      .populate('team')
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

/*
 * Route definitions
 */
app.get('*',function(req,res, next) {
  res.locals.loggedIn = (req.user) ? true : false;
  if (req.user) {
    res.locals._user = {
      team: req.user.team.name,
      username: req.user.username,
      name: req.user.name,
      photo: req.user.photo
    };
  }
  next();
});

//Create session and then redirect
app.post('/login', passport.authenticate('local', { successRedirect: '/',
                                   failureRedirect: '/user/login',
                                   failureFlash: true })
);
app.get('/logout', function(req, res, next) {
  req.logout();
  res.redirect('/');
});

app.use('/', routes);
app.use('/admin', admin);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

app.listen(theport);
