var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var numeral = require('numeral');
var moment = require('moment');
//Dependencies
var User = require('./user');

var teamSchema = new Schema({
  name: {type: String, unique: true},
  mentor: {type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true},
  members: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
  logo: {type: String, default: '/images/profile.jpg'},

  created_at: {type: Date, default: new Date()},

  fundraising_link: String,

  //Ranking ARea
  calls_made: {
    overall: {type: Number, default: 15000},
    this_week: {type: Number, default: 15000},
    weekly: [{week: String, calls: {type: Number, default: 1} }]
  },
  ranking: {
    overall: {type: Number, default: 1},
    this_week: {type: Number, default: 1},
    weekly: [{week: String, rank: {type: Number, default: 1} }]
  }
}, {collection: 'Team'});

//Calls made
teamSchema.virtual('abbrev.calls_made').get(function() {
  if (this.calls_made.overall < 10000) {
    return this.calls_made.overall;
  } else {
    return numeral(this.calls_made.overall).format('0.0a').replace(".0", "");
  }
});

teamSchema.virtual('weekly_ranking').get(function() {
  var currentWeek = moment().format("GGGG WW");
  // var target = this.ranking.weekly.filter(function(w) { return w.week == currentWeek; });

  // if (target.length > 0) {
  var rank = numeral(this.ranking.this_week).format("0o");
  return rank.substring(0, rank.length - 2) + "<sup>" + rank.substring(rank.length-2) + "</sup>";
  // } else {
    // return "-";
  // }
  // return target.rank;
});

teamSchema.virtual('overall_ranking').get(function() {
  var rank =  numeral(this.ranking.overall).format("0o");
  return rank.substring(0, rank.length - 2) + "<sup>" + rank.substring(rank.length-2) + "</sup>";
});


// todo: REDIS opportunity
teamSchema.methods.getCallsThisWeek = function(callback) {
  //
  //var moment = get the Sunday of this week

  // IF Moment cache exists for the hour, get it

  // OTHERWISE call DB and then store cache in it.
  Call
    .aggregate(
      [
      // {$project: { user: 1 }},
      {$match: {
          call_time: { $gt: moment().startOf('week')._d },
          team: this._id
              }},
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: "$call_time" },
          },
          count: { $sum: "$count" }
        }
      }])
    .sort({ '_id' : 1 })
    .limit(7)
    .exec(function(err, calls) {
      //arrange data as such;
      if (err) callback(err);
      if (!calls) {
        callback(null, false);
      } else{
        //Fill out
        while (calls.length < 7) {
          calls.push(
            {
              _id: moment().startOf('week').add(calls.length, 'days').format("YYYY-MM-DD"),
              count: 0
            });
        }
        callback(null, calls);
      }
    })
};

/**
 *  Get the last 30 calls for the month
 */
teamSchema.methods.getCallsThisMonth = function(callback) {
  // OTHERWISE call DB and then store cache in it.
  var that = this;
  Call
      .aggregate(
      [
      // {$project: { user: 1 }},
      {$match: {
          // call_time: { $gt: moment().subtract(30, 'days')._d },
          team: that._id
              }},
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: "$call_time" },
          },
          count: { $sum: "$count" }
        }
      }])
    .sort({ '_id' : 1 })
    .limit(30)
    .exec(function(err, calls) {
      //arrange data as such;
      if (err) callback(err);
      if (!calls) {
        callback(null, false);
      } else{
        callback(null, calls);
      }
    })
};

//call to build mentors
var Team = mongoose.model('Team', teamSchema);

module.exports = Team;
