var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var messageSchema = new Schema({
  sender: { type: String, ref: 'User' },
  room: { type: Schema.Types.ObjectId, ref: 'Room' },
  time: Date,
  text: String
});

messageSchema.statics.getMessagesByRoomId = function (id, callback) {
  var self = this;

  self.find({ room: id }).populate('sender room').exec(function (err, messages) {
    if (err) {
      throw err;
    }

    callback(messages);
  });
};

module.exports = mongoose.model('Message', messageSchema);
