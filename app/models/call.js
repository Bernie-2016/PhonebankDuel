var mongoose = require('mongoose'),
    moment = require('moment'),
    Schema = mongoose.Schema;

var numeral = require('numeral');

//Dependencies
var  Team = require('./team'),
     User = require('./user');

console.log("XXXX", require('./team'));
// Atomic entity for Calls checked in daily
var callSchema = new Schema({
      call_time: Date,
      assignment: String,
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
      count: { type: Number, default: 0 },
      texts: { type: Number, default: 0 },
      tips: String,
      description: String
    },
    { collection : 'Call' });

// THIS WILL ALL GO TO GRUNT! :)
//REDIS EVERY HOUR
callSchema.statics.getTopTeamThisWeek = function(callback) {
  this.aggregate(
      [
      {$match: {
          call_time: { $gt: moment().startOf('week')._d },
          team: { $ne: null }
        },
      },
      {
        $group: {
          _id: {
            team: "$team",
          },
          count: { $sum: "$count" },
          texts: { $sum: "$texts" },
        }
      }
      // { $project: { user: 1, _id: 0 }}
      ])
    .sort({ 'count' : -1 })
    .limit(10)
    .exec(function(err, calls) {
      //arrange data as such;
      if (err) callback(err);
      if (!calls) {
        callback(null, false);
      } else {
        //format score
        Team.populate(calls, {path: "_id.team", select: "name logo"}, function(err, res) {
          // res.forEach(function(c){ c.count = numeral(c.count).format("0.0a"); });
          callback(null, res)
        });
      }
    });
};


callSchema.statics.getTopUserThisWeek = function(callback) {
  this.aggregate(
      [
      {$match: {
          call_time: { $gt: moment().startOf('week')._d },
          user: { $ne: null }
        }
      },
      {
        $group: {
          _id: {
            user: "$user",
          },
          count: { $sum: "$count" },
          texts: { $sum: "$texts" },
        }
      }
      // { $project: { user: 1, _id: 0 }}
      ])
    .sort({ 'count' : -1 })
    .limit(10)
    .exec(function(err, calls) {
      //arrange data as such;
      // console.log(calls, Team);
      if (err) callback(err);
      if (!calls) {
        callback(null, false);
      } else {
        //format score

        User.populate(calls, {path: "_id.user", select: "username photo"}, function(err, res) {
          // res.forEach(function(c){ c.count = numeral(c.count).format("0.0a"); });
          callback(null, res)
        });
      }
    });
};

//REDIS EVERY HOUR TOO
callSchema.statics.getTopTeamOverall = function(callback) {
  this.aggregate(
      [
      { $match: {
          team: { $ne: null }
        }
      },
      {
        $group: {
          _id: {
            team: "$team",
          },
          count: { $sum: "$count" },
          texts: { $sum: "$texts" },
        }
      }
      // { $project: { user: 1, _id: 0 }}
      ])
    .sort({ 'count' : -1 })
    .limit(10)
    .exec(function(err, calls) {
      //arrange data as such;
      if (err) callback(err);
      if (!calls) {
        callback(null, false);
      } else {
        Team.populate(calls, {path: "_id.team", select: "name logo"}, function(err, res) {

          //format score
          // res.forEach(function(c){ c.count = numeral(c.count).format("0.0a"); });
          callback(null, res)
        });
      }
    });
}


/**
 *  Top User OVERALL
 */
callSchema.statics.getTopUserOverall = function(callback) {
  this.aggregate(
      [
      { $match: {
          user: { $ne: null }
        }
      },
      {
        $group: {
          _id: {
            user: "$user",
          },
          count: { $sum: "$count" },
          texts: { $sum: "$texts" },
        }
      }
      // { $project: { user: 1, _id: 0 }}
      ])
    .sort({ 'count' : -1 })
    .limit(10)
    .exec(function(err, calls) {
      //arrange data as such;
      if (err) callback(err);
      if (!calls) {
        callback(null, false);
      } else {
        User.populate(calls, {path: "_id.user", select: "username photo"}, function(err, res) {
          // res.forEach(function(c){ c.count = numeral(c.count).format("0.0a"); });
          callback(null, res)
        });
      }
    });
};


callSchema.statics.getCallsThisWeek = function(target, callback) {
  var match = {};

  if ( target instanceof User) {
    match = {$match: {
                call_time: { $gt: moment().startOf('week')._d },
                user: target._id
            }};
  } else if ( target instanceof Team) {
    match = {$match: {
                call_time: { $gt: moment().startOf('week')._d },
                team: target._id
            }};
  }


  //// CALL PROPER
  this.aggregate(
      [ match,
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: "$call_time" },
          },
          count: { $sum: "$count" },
          texts: { $sum: "$texts" },
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
        // while (calls.length < 7) {
        //   calls.push(
        //     {
        //       _id: moment().startOf('week').add(calls.length, 'days').format("YYYY-MM-DD"),
        //       count: 0
        //     });
        // }
        callback(null, calls);
      }
    })
};

callSchema.statics.getCallsThisMonth = function(target, callback) {
  // OTHERWISE call DB and then store cache in it.

  var match = {};
  if ( target instanceof User) {
    match = {$match: {
                call_time: { $gt: moment().subtract(30, 'days')._d },
                user: target._id
            }};
  } else if ( target instanceof Team) {
    match = {$match: {
                call_time: { $gt: moment().subtract(30, 'days')._d },
                team: target._id
            }};
  }

  this.aggregate(
      [ match,
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: "$call_time" },
          },
          count: { $sum: "$count" },
          texts: { $sum: "$texts" },
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

var Call = mongoose.model('Call', callSchema);

module.exports = Call;
