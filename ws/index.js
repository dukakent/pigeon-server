var User = require('../models/user');
var Partnership = require('../models/partnership');
var Room = require('../models/room');
var Message = require('../models/message');
var Invite = require('../models/partnerInvite');

module.exports = (function () {
  var forExport = {};

  var connectedPeople = {};

  var io = null;

  forExport.init = function (newIo) {
    io = newIo;
    io.sockets.on('authenticated', onAuth)
  };

   function onAuth(socket) {
    var selfId = socket.decoded_token.sub;
    connectedPeople[selfId] = socket;

    User
      .findById(selfId)
      .exec(function (err, selfUser) {
        if (err) {
          throw err;
        }

        socket.on('invite', onInvite(selfUser));
        socket.on('invite/approve', onApproveInvite(selfUser));
        socket.on('invite/reject', onRejectInvite(selfUser));
        socket.on('partner/remove', onPartnerRemove(selfUser));
        socket.on('message/new', onMessageNew(selfUser));
        socket.on('disconnect', onUserDisconnect(selfUser));
      });

    Room.getRoomsByUserId(selfId, function (rooms) {
        rooms.forEach(function (room) { socket.join(room._id); });
      })
  };

  function onApproveInvite(invitee) {
    return function (inviteId) {
      Invite
        .findById(inviteId)
        .populate('from to')
        .exec(function (err, invite) {
          if (err) {
            throw err;
          }

          if (invite.to._id !== invitee._id) {
            return false;
          }


          Room.create({
            name: invite.from.name + ', ' + invite.to.name,
            participants: [invite.from._id, invite.to._id]
          }, function (err, newRoom) {
            var inviteeSocket = connectedPeople[invite.to._id];
            var inviterSocket = connectedPeople[invite.from._id];

            var partnershipQuery = {
              partners: [
                invite.from._id,
                invite.to._id
              ],
              personalRoom: newRoom._id
            };

            inviteeSocket && inviteeSocket.emit('room/new', newRoom);
            inviterSocket && inviterSocket.emit('room/new', newRoom);

            Partnership.findOne(partnershipQuery, function (err, partnership) {
              if (!partnership) {
                Partnership.create(partnershipQuery);

                inviteeSocket && inviteeSocket.emit('partner/new', invite.from);
                inviterSocket && inviterSocket.emit('partner/new', invite.to);
              }

              invite.remove();
            });
          });
        });
    }
  }

  function onRejectInvite(invitee) {
    return function (inviteId) {
      Invite
        .findById(inviteId)
        .populate('from to')
        .exec(function (err, invite) {
          if (err) {
            throw err;
          }

          if (invite.to._id !== invitee._id) {
            return false;
          }

          invite.remove();
        });
    }
  }

  function onPartnerRemove(initiator) {
    return function (initiateeId) {
      Partnership
        .findOne({
          $and: [
            { partners: initiator._id },
            { partners: initiateeId }
          ]
        })
        .populate('partners')
        .exec(function (err, partnership) {
          var initiatee = partnership.partners.find(function (partner) {
            return partner._id === initiateeId;
          });

          var initiateeSocket = connectedPeople[initiatee._id];
          var initiatorSocket = connectedPeople[initiator._id];

          if (initiateeSocket) {
            initiateeSocket.emit('partner/remove', initiator._id);
            initiateeSocket.emit('room/remove', partnership.personalRoom._id);
          }

          if (initiatorSocket) {
            initiateeSocket.emit('room/remove', partnership.personalRoom._id);
          }

          Room.findById(partnership.personalRoom).exec(function (err, data) {
            data.remove();
            partnership.remove();
          });
        });
    }
  }

  function onInvite(inviter) {
    return function (inviteeId) {

      var inviteQuery = {
        from: inviter._id,
        to: inviteeId
      };

      Invite.findOne(inviteQuery, function (err, invite) {
        !invite && Invite.create(inviteQuery, function (err, newInvite) {
          var invitineeSocket = connectedPeople[inviteeId];

          if (invitineeSocket) {
            Invite.populate(newInvite, 'from to', function () {
              invitineeSocket.emit('invite', newInvite);
            });
          }
        });
      });
    }
  }

  function onMessageNew(sender) {
    return function (message) {
       Message
         .create(message, function (err, mess) {
           var senderSocket = connectedPeople[sender._id];

           Message.populate(mess, 'room sender', function (err, message) {
             io.in(message.room._id).emit('message/new', message);
           });
         })
    }
  }

  function onUserDisconnect(user) {
    return function () {
      delete connectedPeople[user._id];
    }
  }

  return forExport;
})();
