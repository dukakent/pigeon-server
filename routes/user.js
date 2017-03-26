var express = require('express');
var User = require('../models/user');
var Room = require('../models/room');
var router = express.Router();

router.post('/', function (req, res) {
  if (!req.body._id) {
    console.log(req.body);
    res.status(404).send();
  }

  User
    .findByIdAndUpdate(
      req.body.user_id,
      req.body,
      {upsert: true, setDefaultsOnInsert: true, new: true }
    )
    .populate('partners')
    .exec(function (err, newUser) {
      res.send(newUser);
    });
});

router.get('/id/:id', function (req, res) {
  if (!(req.user || req.params.id)) {
    return false;
  }

  var selfId = req.user.sub;
  var lookingId = req.params.id;

  User
    .findById(selfId)
    .exec(function (err, collection) {
      if (err) {
        return false;
      }

      var isPartner = collection.partners.indexOf(lookingId) >= 0;

      if (!isPartner) {
        return false;
      }

      User
        .findById(lookingId)
        .exec(function (err, collection) {
          if (!err && collection) {
            res.send(collection);
          }
        });
    });
});

router.get('/search', function (req, res, next) {
  if (!req.query.q) {
    return false;
  }

  var selfId = req.user.sub;
  var keyword = req.query.q;

  if (!/^[\w\s]+$/.test(keyword)) {
    res.send([]);
  }

  User
    .find({
      name: new RegExp(keyword, 'i')
    })
    .select('-partners')
    .exec(function (err, users) {
      if (err) {
        return false;
      }

      users = users.filter(function (user) {
        return user._id !== selfId;
      });

      res.send(users);
    });
});

module.exports = router;
