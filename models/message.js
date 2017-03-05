var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var messageSchema = new Schema({
  sender: { type: String, ref: 'User' },
  receiver: { type: String, ref: 'User' },
  room: { type: Schema.Types.ObjectId, ref: 'Room' },
  time: Date,
  text: String
});

module.exports = mongoose.model('Message', messageSchema);
