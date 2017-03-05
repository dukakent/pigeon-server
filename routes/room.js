var express = require('express');
var User = require('../models/user');
var Room = require('../models/room');
var router = express.Router();

router.get('/id/:id', function () {
  if (!(req.user || req.params.id)) {
    return false;
  }

  var selfId = req.user.sub;
  var lookingRoomId = req.params.id;

  User
    .findById(selfId)
    .exec(function (err, userCollection) {
      if (err) {
        return false;
      }

      Room
        .findById(lookingRoomId)
        .exec(function (err, roomCollection) {
          if (err || !roomCollection) {
            return false;
          }

          if (roomCollection.participants.indexOf(userCollection._id) === -1) {
            return false;
          }

          res.send(roomCollection);
        });
    });
});

router.post('/new', function (req, res) {
  var participants = req.body.participants;
  var name = req.body.name || participants.join(', ');

  Room.create({
    participants: participants,
    name: name
  }, function (err) {
    if (!err) {
      res.status(200).send();
    }
  })
});

module.exports = router;
