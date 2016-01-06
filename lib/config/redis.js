'use strict';

var expressSession = require('express-session');

module.exports = function(app) {
  var __REDISTOGO_URL__ = process.env.REDISTOGO_URL || 'redis://localhost:6379';

  var RedisStore = require('connect-redis')(expressSession);
  app.use(expressSession({
      store: new RedisStore({ url: __REDISTOGO_URL__ }),
      secret: 'keyboard cat',
      resave: true,
      saveUninitialized: true
  }));
}
