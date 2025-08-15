const mongoose = require('mongoose');

const PackingSlipSchema = new mongoose.Schema({
  id: String,
  customer: String,
  billTo: String,        // ✅ Added
  shipTo: String,
  po: String,            // ✅ Added
  shipDate: String,      // ✅ Added
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
