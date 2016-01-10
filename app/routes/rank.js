var express = require('express');
var router = express.Router();

//Models...
var RankServices = require('./services/rank');

// Start of Index - Personal user page OR go back homepage
// router.use('/', function(req, res, next) {
//   res.render('rank', {type: "caller", time: "overall"});
//})

/* Get Team Rankings */
router.get('/team(/:timeline)?', RankServices.teamRanking);

/* Personal Rankings*/
router.get('/caller(/:timeline)?', RankServices.callerRanking);
// End of index

module.exports = router;
