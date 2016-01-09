var sassMiddleware = require('node-sass-middleware'),
    path = require('path'),
    favicon = require('serve-favicon'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    flash = require('express-flash'),
    express = require('express'),
    passport = require('passport'),
    bodyParser = require('body-parser');

module.exports = function(app) {
  //Setup sass middleware

  app.use(sassMiddleware({
      /* Options */
      src: path.join(__dirname, '../../app/styles'),
      dest: path.join(__dirname, '../../public/stylesheets'),
      debug: true,
      outputStyle: 'compressed',
      prefix:  '/stylesheets'  // Where prefix is at <link rel="stylesheets" href="prefix/style.css"/>
  }));

  // view engine setup
  app.set('views', path.join(__dirname, '../../app/views'));
  app.set('view engine', 'jade');

  // uncomment after placing your favicon in /public
  //app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
  app.use(logger('dev'));
  app.use(bodyParser());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));

  app.use(cookieParser());
  app.use(flash());

  app.use(express.static(path.join(__dirname, '../../public')));

  /*
   * Configurations for `passport`
   */
  // app.use(expressSession({ secret: 'Bernie Sanders 2016' }));
  // var session = require('express-session');
  //Configuring redis session..


  // Setup Passport
  app.use(passport.initialize());
  app.use(passport.session());
  require('./passport')(passport);

}
