var User = require('../models/user');
var Partnership = require('../models/partnership');
var Invite = require('../models/partnerInvite');

module.exports = (function () {
  var public = {};

  var connectedPeople = {};

  public.onUserConnect = function (socket) {
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
        socket.on('disconnect', onUserDisconnect(selfUser));
      });
  }

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

          var partnershipQuery = {
            partners: [
              invite.from._id,
              invite.to._id
            ]
          };

          Partnership.findOne(partnershipQuery, function (err, partnership) {
            if (!partnership) {
              Partnership.create(partnershipQuery);

              var inviteeSocket = connectedPeople[invite.to._id];
              var inviterSocket = connectedPeople[invite.from._id];

              inviteeSocket && inviteeSocket.emit('partner/new', invite.from);
              inviterSocket && inviterSocket.emit('partner/new', invite.to);
            }

            invite.remove();
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

          if (initiateeSocket) {
            initiateeSocket.emit('partner/remove', initiator._id);
          }

          partnership.remove();
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
            invitineeSocket.emit('invite', newInvite);
          }
        });
      });
    }
  }

  function onUserDisconnect(user) {
    return function () {
      delete connectedPeople[user._id];
    }
  }

  return public;
})();
