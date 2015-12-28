var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var numeral = require('numeral');
var moment = require('moment');

// var Call = require('./call');
/**
 * Defining User Schema
 */

var Schema = mongoose.Schema;

var userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  name: String,
  email: { type: String, required: true, unique: true },
  photo: {type: String, default: '/images/profile.jpg'},
  password: { type: String, required: true, minlength: [8, "Password should have a minimum of eight(8) characters"] },

  team: {type: mongoose.Schema.Types.ObjectId, ref: 'Team'},

  admin: {type: Boolean, default: false},

  // Confirmation
  activated: {type: Boolean, default: false},
  registration_code: String,

  created_at: Date,
  updated_at: Date,

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

}, {collection: 'User'});


userSchema.methods.encryptPassword = function(next) {
  var that = this;
  bcrypt.hash(this.password, null, null, function(err, hash) {
    that.password = hash;
    next();
  });
};

userSchema.virtual('abbrev.calls_made').get(function() {
  if (this.calls_made.this_week < 10000) {
    return this.calls_made.this_week;
  } else {
    return numeral(this.calls_made.this_week).format('0.0a').replace(".0", "");
  }
});

userSchema.virtual('abbrev.calls_this_week').get(function() {
  if (this.calls_made.overall < 10000) {
    return this.calls_made.overall;
  } else {
    return numeral(this.calls_made.overall).format('0.0a').replace(".0", "");
  }
});


/**
 *  This will print the weekly rankings...
 */
userSchema.virtual('weekly_ranking').get(function() {
  var currentWeek = moment().format("GGGG WW");

  var rank = numeral(this.ranking.this_week).format("0o");
  return rank.substring(0, rank.length - 2) + "<sup>" + rank.substring(rank.length-2) + "</sup>";
});

userSchema.virtual('overall_ranking').get(function() {
  var rank =  numeral(this.ranking.overall).format("0o");
  return rank.substring(0, rank.length - 2) + "<sup>" + rank.substring(rank.length-2) + "</sup>";
});

//Create registration code for when the user registers
userSchema.methods.createRegistrationCode = function() {
  var that = this;
  return this.registration_code;
};

//Check if password given by user is valid:
userSchema.methods.validPassword = function(candidatePassword, callback) {
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if(err) return callback(err);
    callback(err, isMatch);
  });
};

// todo: REDIS opportunity
// userSchema.methods

/**
 *  Get the last 30 calls for the month
 */
// userSchema.methods


userSchema.pre('save', function(next) {
  var currentDate = new Date();

  this.updated_at = currentDate;

  if (!this.created_at) {
    this.created_at = currentDate;
    this.encryptPassword(next);
  }
  // next();
});



var User = mongoose.model('User', userSchema);

module.exports = User;
