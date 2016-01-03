var shortid = require('shortid');
var Team = require('../app/models/team');

var mongoose = require('mongoose');

var __MONGO_URL__ =
  process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://localhost/phonebankduel';


mongoose.connect(__MONGO_URL__);


// console.log("XXX", shortid.generate());
Team.find({short_id: { $eq: null }}, function(err, teams) {
  if (err) { throw err; }
  teams.forEach(function(team) {
    console.log(team);
    team.short_id = shortid.generate();
    team.save(function(err, _t) {
      if (err) { throw err; }
      console.log("Saved short id :: TEAM %s --- %s", team.name, team.short_id);
    });
  });
});
