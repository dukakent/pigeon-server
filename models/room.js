var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var roomSchema = new Schema({
  name: String,
  participants: [{ type: String, ref: 'User' }]
});

roomSchema.statics.getRoomsByUserId = function (id, callback) {
  var self = this;

  self
    .find({ participants: id })
    .populate('participants')
    .exec(function (err, rooms) {
      if (err) {
        throw err;
      }

      callback(rooms);
    });
};

module.exports = mongoose.model('Room', roomSchema);
