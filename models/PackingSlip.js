const mongoose = require('mongoose');

const PackingSlipSchema = new mongoose.Schema({
  id: String,
  customer: String,
  shipTo: String,
  date: String,
  invoice: String,
  items: [Object],
  void: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('PackingSlip', PackingSlipSchema);
