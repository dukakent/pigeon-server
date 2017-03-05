var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var partnershipInvitationSchema = new Schema({
  from: { type: String, ref: 'User' },
  to: { type: String, ref: 'User' },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
});

module.exports = mongoose.model('PartnerInvite', partnershipInvitationSchema);
