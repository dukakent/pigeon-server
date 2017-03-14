var express = require('express');
var User = require('../models/user');
var Room = require('../models/room');
var Message = require('../models/message');
var router = express.Router();

router.get('/id/:id', function (req, res) {
  if (!(req.user || req.params.id)) {
    return false;
  }

  var selfId = req.user.sub;
  var lookingRoomId = req.params.id;

  Room
    .findById(lookingRoomId)
    .populate('participants')
    .exec(function (err, room) {
      if (err) {
        return false;
      }

      var isAvailable = room.participants.find(function (partner) { return partner._id === selfId});

      if (!isAvailable) {
        res.status(401).send();
        return false;
      }

      res.send(room);
    });
});

router.get('/id/:id/messages', function (req, res) {
  if (!(req.user || req.params.id)) {
    return false;
  }

  var selfId = req.user.sub;
  var lookingRoomId = req.params.id;

  Message.getMessagesByRoomId(lookingRoomId, function (messages) {
    res.send(messages);
  });
});

router.get('/myRooms', function (req, res) {
  var selfId = req.user.sub;

  Room.getRoomsByUserId(selfId, function (rooms) {
    res.send(rooms);
  });
});

module.exports = router;
