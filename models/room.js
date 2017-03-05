var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var roomSchema = new Schema({
  name: String,
  participants: [{ type: String, ref: 'User' }]
});

module.exports = mongoose.model('Room', roomSchema);
