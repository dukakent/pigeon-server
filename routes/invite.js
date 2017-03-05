var express = require('express');
var PartnerInvite = require('../models/partnerInvite');
var router = express.Router();

router.get('/', function (req, res) {

});

router.get('/sent', function (req, res) {
  var selfId = req.user.sub;

  findInvites({ from: selfId }, function (invites) {
    res.send(invites);
  });
});

router.get('/received', function (req, res) {
  var selfId = req.user.sub;

  findInvites({ to: selfId }, function (invites) {
    res.send(invites);
  });

});

function findInvites(queryObject, callback) {
  PartnerInvite
    .find(queryObject)
    .populate('from to')
    .exec(function (err, invites) {
      if (err) {
        throw err;
      }

      callback(invites);
    });
}

module.exports = router;
