var express = require('express');


//Getting config variables
var __MONGO_URL__ =
  process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://localhost/pbd';

var __PORT__ = process.env.PORT || 5000;


//Mongoose
// getting-started.js
var mongoose = require('mongoose');
mongoose.connect(__MONGO_URL__);
mongoose.set('debug', true);

//Routes
var routes = require('./app/routes/index')
  , admin = require('./app/routes/admin/index');



var app = express();

require('./lib/config/express')(app);
require('./lib/config/redis')(app);

/*
 * Route definitions
 */
app.get('*',function(req,res, next) {

  res.locals.loggedIn = (req.user) ? true : false;
  if (req.user) {
    res.locals._user = {
      username: req.user.username,
      name: req.user.name,
      photo: req.user.photo,
      team: req.user.team
    };
  }
  next();
});

//Create session and then redirect


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

app.listen(__PORT__);

module.exports = app;
