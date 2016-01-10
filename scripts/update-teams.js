var Team = require('../app/models/team');

var mongoose = require('mongoose');

var __MONGO_URL__ =
  process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://localhost/phonebankduel';

mongoose.connect(__MONGO_URL__);


Team.collection.update({name: "Left Coast"}, { $set: { league: 'Reddit League'}});
Team.collection.update({name: "Apollo"}, { $set: { league: 'Reddit League'}});
Team.collection.update({name: "Kittens"}, { $set: { league: 'Reddit League'}});
Team.collection.update({name: "International"}, { $set: { league: 'Reddit League'}});
Team.collection.update({name: "Eye"}, { $set: { league: 'Reddit League'}});
Team.collection.update({name: "Puppies"}, { $set: { league: 'Reddit League'}});
Team.collection.update({name: "North Atlantic"}, { $set: { league: 'Reddit League'}});
Team.collection.update({name: "Lane"}, { $set: { league: 'College League'}});
Team.collection.update({name: "University of Tennessee"}, { $set: { league: 'College League'}});
Team.collection.update({name: "Pitt for Bernie"}, { $set: { league: 'College League'}});
Team.collection.update({name: "Boston University"}, { $set: { league: 'College League'}});
Team.collection.update({name: "Bobcats for Bernie"}, { $set: { league: 'College League'}});
Team.collection.update({name: "Stanford for Bernie"}, { $set: { league: 'College League'}});
Team.collection.update({name: "University of Oregon"}, { $set: { league: 'College League'}});
Team.collection.update({name: "UC Davis for Bernie"}, { $set: { league: 'College League'}});
Team.collection.update({name: "Cal Poly SLO"}, { $set: { league: 'College League'}});
Team.collection.update({name: "WVU Students for Bernie"}, { $set: { league: 'College League'}});
Team.collection.update({name: "Anxious Aye-aye"}, { $set: { league: 'Reddit League'}});
Team.collection.update({name: "Jeezum Crow"}, { $set: { league: 'Reddit League'}});
Team.collection.update({name: "Emerson College"}, { $set: { league: 'College League'}});
Team.collection.update({name: "Duke for Bernie"}, { $set: { league: 'College League'}});
Team.collection.update({name: "Badgers for Bernie (UW-Madison)"}, { $set: { league: 'College League'}});
Team.collection.update({name: "That Berning Sensation"}, { $set: { league: 'Reddit League'}});
Team.collection.update({name: "The Bern Ultimatum"}, { $set: { league: 'Reddit League'}});
Team.collection.update({name: "MTHS for Bernie"}, { $set: { league: 'College League'}});
Team.collection.update({name: "UC Berkeley"}, { $set: { league: 'College League'}});

console.log("Updated");
