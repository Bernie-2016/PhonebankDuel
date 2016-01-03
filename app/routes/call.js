var express = require('express');
var router = express.Router();

var Call = require('../models/call');
var Activity = require('../models/activity');

router.post('/submit', [
  // ::: 1 :::
  // Save call for user
  function(req, res, next) {
    var user = req.user;
    var call = Call(req.body.call);
    call.user = user._id;
    call.team = user.team;
    call.call_time = new Date();

    call.save(function(err, call) {
      if (err) {
        req.flash('error', err.message);
      };

      req.call = call;
      next();
    });
  },
  // ::: 2 :::
  // Create Activity regarding the call
  // req flash success!
  function(req, res, next) {
    var call = req.call;
    var action = "";

    if (call.count > 0 && call.texts == 0) {
      action = "made " + call.count + " calls.";
    }
    else if (call.count == 0 && call.texts > 0) {
      action = "sent " + call.texts + " text messages";
    }
    else if (call.count > 0 && call.texts > 0) {
      action = "made " + call.count + " calls and sent " + call.texts + " text messages";
    }

    var banner = call.description ? ('<q>&ldquo;' + call.description + '&rdquo;</q>') : "";
        banner += call.tips ? ('<sub>Tip: ' + call.tips + '</sub>') : "";

    var activity = Activity({
      users_involved: [ call.user ],
      teams_involved: [ call.team ],
      source: {
          label: req.user.username,
          url: "/user/u/" + req.user._id
        },
      action: action,
      target: null,
      icon: '/images/phonebank.png',
      banner: banner,
      activity_date: new Date()
    });

    activity.save(function(err) {
      if (err) {
        throw err;
      }

      req.flash('info', 'Thank you for submitting your phonebank action!');
      res.redirect('back');
    });
  }
]);

module.exports = router;
