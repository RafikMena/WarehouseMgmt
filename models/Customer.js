const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  name: String,
  address: String,
  shipTos: [String],
});

module.exports = mongoose.model('Customer', CustomerSchema);
