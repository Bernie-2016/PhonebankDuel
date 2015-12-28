var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var moment = require('moment');

var activitySchema = new Schema({

  // The following are tags for users and teams, to be shown in their respective pages
  users_involved: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
  teams_involved: [{type: mongoose.Schema.Types.ObjectId, ref: 'Team'}],

  // The following are the ones that will show up in the activity
  // This follows the format #{SOURCE} #{ACTION} #{TARGET}
  source: {
    label: String,
    url: String
  },
  action: String,
  target: {
    label: String,
    url: String
  },

  //The banner underneath the declaration of activity. This is in html
  icon: {type: String, default: "/images/profile.jpg"},
  banner: {type: String, default: "<h4>This is a banner</h4><p>This is a description of the banner</p>"},

  activity_date: { type: Date }

}, {collection: 'Activity'});

activitySchema.virtual('time_ago').get(function() {
  return moment(this.activity).fromNow();
});

var Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;
