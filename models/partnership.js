var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var partnershipSchema = new Schema({
  partners: {
    type: [{ type: String, ref: 'User' }],
    default: []
  }
});

partnershipSchema.statics.getPartnersByUserId = function (id, callback) {
  this
    .find({ partners: id })
    .populate('partners')
    .exec(function (err, partnerships) {
      if (err) {
        throw err;
      }

      var partners = [];


      partnerships.forEach(function (partnership) {
        var otherPartners = partnership.partners.find(function (partner) {
          return partner._id !== id;
        });

        partners.push(otherPartners);
      });

      callback(partners);
    });
};

module.exports = mongoose.model('Partnership', partnershipSchema);;
