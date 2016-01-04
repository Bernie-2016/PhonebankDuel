var mongoose = require('mongoose');

var __MONGO_URL__ =
  process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://localhost/phonebankduel';


mongoose.connect(__MONGO_URL__);
var bcrypt = require('bcrypt-nodejs');
var numeral = require('numeral');
var moment = require('moment');
// var process =require('process');

var User = require('./app/models/user');
var Team = require('./app/models/team');
var Activity = require('./app/models/activity');
var Call = require('./app/models/call');

var async = require('async');

var fs = require('fs');

//Load initial leaders and teams
var teams =
  [{ team: "Left Coast", leader: "davedsf", email: "davedoering@hotmail.com"},
   { team: "Meech", leader: "Meech4Bernie", email: "dmitrylevin12@gmail.com"},
   { team: "Kittens", leader: "kateschmidt", email: "katya@kateschmidt.com"},
   { team: "International", leader: "unclepeso", email: "jonatan.stencl@gmail.com"},
   { team: "Eye", leader: "SoddenEye", email: "ncs13@my.fsu.edu"},
   { team: "Puppies", leader: "sailortitan", email: "sailor_titan@moonsenshi.net"},
   { team: "North Atlantic", leader: "wanderso24", email: "wtanderso24@gmail.com"},
  ];

//Save / Create user
var createUser = function(callback) {
  console.log("Creating Users");
    async.eachSeries(teams, function(team, callback) {
        console.log("Saving ", team.team);
        User.findOne({ email: team.email }, function(err, user) {
          if ( !user ) {
            var u1 = {
              username: team.leader,
              email: team.email,
              password: ''
            };

            console.log("Saving ... " , u1.email);
            User.collection.insert(u1, function(err2, inserted) {
              if (err2) console.log(err2, inserted);
              callback(null);
            }); // end of colllection.insert
          } // end of if( !user )
          else {
            callback(null);
          }
        });
    }, function(err) {
      console.log("Final");
      callback(null);
    });
  // console.log("Finished");
  // callback(null);
};

var saveTeams = function(callback) {
  console.log("Saving teams");
  async.eachSeries(teams, function(team, callback) {
    User.findOne({ email: team.email }, function(err, user) {
      console.log(user);
      if (err) { console.log(err); throw err; }

      if (user) {
        Team.findOne({ name: team.team }, function(err2, _team) {
          if (err2) { console.log(err2); throw err2; }

          if (!_team) {
            var t = Team({ name: team.team, mentor: user._id, members: [user._id] });
            t.save(function(err3) {
              if (err3) { console.log(err3); throw err3; }
              user.team = t._id;
              User.collection.update({email: user.email}, { $set: { team: t._id }}, function(err4) {
                if (err4) { console.log(err4); throw err4; }
                console.log("Team created! -- ", t.name );
                callback(null);
              });
            });
          } else {
            callback(null);
          }// end of !_team;
        }); // end of Team.findOne
      } else {
        callback(null);
      }
    })
  }, function(err) {
    console.log("Saved teams");
    callback(null);
  });

}; // end of saveTeams

var saveActivities = function(callback) {
  fs.readFile('./app/_data/sample.json', function(err, data) {
  if(err) throw err;
  var json = JSON.parse(data.toString());

  // console.log(json);

  //Bulk this one!
  Call
    .findOne()
    .sort({ call_time: -1 })
    .exec(function(err, call) {
      // var currentDate = call ? call.call_time : moment().subtract(365, 'days')._d;
      var currentDate = new Date("2016-01-03T03:33:05Z");
        //Create Users if needed
        async.eachSeries(json.result, function(callReport, callback) {

          // console.log(dataObj);
          // callback(null);



          var callDate = new Date(callReport.Timestamp);


          // console.log(callDate);
          if(callDate <= currentDate) { callback(null); return;  }

          console.log(currentDate, " --- ", callDate);


          var date = new Date(callReport.Timestamp);
          var username = callReport['Reddit Username'];
          var email = callReport['Email address associated with phonebank assignment'];
          var callCount = parseInt(callReport['How many calls did you make?']);
          var assignment = callReport['What calling assignment?'];
          var team = callReport['Are you on a Mentor Team?'];
          var teamRexp = team.match(/Team (.+?) \((.*)\)/i)
          // console.log(team, teamRexp);
          var teamName = (!teamRexp || team == "[Blank]") ? null : teamRexp[1];

          if(!email || email == '' ) { callback(null); return; }
          if(!username || username == '' ) { callback(null); return; }
          if(!date ) { callback(null); return; }


          async.waterfall([
            function(callback) {


              var dataObj = {
                  date: date,
                  username: username,
                  email: email,
                  callCount: callCount,
                  assignment: assignment,
                  teamName: teamName
              };
              callback(null, dataObj);
            },
            function(dataObj, callback) {
              //check team
              console.log("1. GETTING Team");
              if (dataObj.teamName) {
                Team.findOne({ name: dataObj.teamName }, function(err, team) {
                  if (err) console.log(err);
                  callback(null, dataObj, team);
                });
              } else {
                callback(null, dataObj, null);
              }
            },
            function (obj, team, callback) {
              // save user
              console.log("2. Finding User");
              User.findOne({ email: obj.email }, function(err, user) {
                if (!user) {
                  User.collection.insert({ email: obj.email, username: obj.username, password: '', team: (team ? team._id : null) }, function(err, newTarget) {
                    //send user
                    User.find({ email: obj.email }, function(err, user) {
                      callback(null, obj, team, user);
                    })
                  });
                } else {
                  user.team = team ? team._id : null;
                  user.save(function(err) {
                    callback(null, obj, team, user);
                  });
                }
              });
            },
              function(obj, team, user, callback) {
              //Create call
              console.log("3. Save call ~~~ ", obj.date);
              var call = Call({
                team: ( team ? team._id : null),
                user: user._id,
                count: obj.callCount,
                assignment: obj.assignment,
                call_time: obj.date
              });

              call.save(function(err) {
                callback(null, obj, team, user);
              });
            },
              function(obj, team, user, callback) {
                //Create Activity
                console.log("4. Save Activity")
                var activity = Activity({
                  users_involved: [user._id],
                  teams_involved: (team ? [team._id] : []),
                  source: {
                    label: user.username,
                    url: "/user/u/" + user._id
                  },
                  action: "called",
                  target: {
                    label: obj.callCount + " people for " + obj.assignment,
                    url: "javascript: void(null);"
                  },
                  icon: "/images/phonebank.png",
                  banner: "<h3>" + obj.callCount + " people called!</h3>",
                  activity_date: obj.date
                });

                activity.save(function(err) {
                  callback(null);
                });
              }
            ],
              function(err) {
                if (err) {
                  console.log("Error happened :: ", err);
                }
                console.log("5. Everything is done! ");
                callback(null);
              }
            ); // End of Waterfall
        }, function(err) {
          callback(null);
        }); // End of Async series

      // callback(null);

    });
  });
  // callback(null);
};

async.series([createUser, saveTeams, saveActivities],
      function(err) { console.log("Final"); });
// // saveActivities;

// var Upload = require('s3-uploader');
// var s3UserClient = new Upload('www.phonebankduel.com', {
//                 aws: {
//                   path: 'user/',
//                   region: 'us-east-1',
//                   acl: 'public-read'
//                 },
//                 cleanup: {
//                   versions: true,
//                   original: false
//                 },
//                 original: {
//                   awsImageAcl: 'private'
//                 },
//                 versions: [{
//                   maxHeight: 1040,
//                   maxWidth: 1040,
//                   format: 'jpg',
//                   suffix: '-large',
//                   quality: 80,
//                   awsImageExpires: 31536000,
//                   awsImageMaxAge: 31536000
//                 },{
//                   maxWidth: 780,
//                   aspect: '3:2!h',
//                   suffix: '-medium'
//                 },{
//                   maxWidth: 320,
//                   aspect: '16:9!h',
//                   suffix: '-small'
//                 },{
//                   maxHeight: 100,
//                   aspect: '1:1',
//                   format: 'png',
//                   suffix: '-thumb1'
//                 },{
//                   maxHeight: 250,
//                   maxWidth: 250,
//                   aspect: '1:1',
//                   suffix: '-thumb2'
//                 }]
//               });


// s3UserClient.upload('./public/images/registration.jpg', {}, function(err, versions, meta) {
//   if (err) { throw err; }

//   versions.forEach(function(image) {
//     console.log(image.width, image.height, image.url);
//     // 1234 4567 https://my-bucket.s3.amazonaws.com/path/ab/cd/ef.jpg
//   });
// });

// Call.getTopTeamOverall(function(err, result) {
//   console.log(result);
//   process.exit();
// });

// User.findOne({}, function(err, user) {

//   console.log(user);
//   user.getCallsThisWeek(function(err, calls) {
//     if (err) throw err;

//     calls.forEach(function(call, i) {
//       console.log(call);
//     });

//     process.exit();
//   });
// });
// Call
//   .aggregate(
//     [
//     // {$project: { user: 1 }},
//     {$match: {
//         call_time: { $gt: moment().subtract(30, 'days')._d },
//         user: new mongoose.Types.ObjectId("5680628499dac4542c4d5b82")
//             }},
//     {
//       $group: {
//         _id: {
//           $dateToString: { format: '%Y-%m-%d', date: "$call_time" },
//         },
//         count: { $sum: "$count" }
//       }
//     }])
//   .sort({ '_id' : 1 })
//   .exec(function(err, calls) {
//     if (err) throw err;
//     // console.log(calls);
//     calls.forEach(function(call, ind) {
//       console.log(call);
//     });

//     process.exit();
//   });

// console.log(moment().startOf('week'));

// User.find({_id: "568062683503b9761cf75bd6" }, function(err, users) {
//   users.forEach(function(item) {
//     for (var j = 0; j < 100; j ++)
//     for (var i = 0; i < 30; i ++) {

//       var coinToss = Math.floor(Math.random() * 10);
//       var callsMade = 0;

//       if (coinToss == 5) {
//         callsMade = 0;
//       } else if (coinToss % 2 == 0) {
//         callsMade = Math.random() * 500;
//       } else {
//         callsMade = Math.random() * 10;
//       }

//     var call = new Call({
//                 user: item._id,
//                 team: "5680887a47234ece2271f182",
//                 count: Math.floor(callsMade),
//                 call_time: moment().subtract(i, 'days')._d
//               });
//       call.save(function(err) {
//           if (err) throw err;

//           console.log("Saved" + item._id);
//       });
//     }
//   })
// });

// var activities = Activity
//                   .find({users_involved: "568062683503b9761cf75bd6" })
//                   .populate('users_involved')
//                   .exec(function(err, activities) {
//                     console.log("XXX", activities);
//                   });
// var hash = bcrypt.hashSync("rapicastillo");

// console.log(numeral(15000).format('0.0a'));


// console.log(hash);
