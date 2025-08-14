// ✅ models/Item.js
const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  itemCode: { type: String, required: true },
  packing: { type: Number, required: true },
  yards: { type: Number, required: true },
});

module.exports = mongoose.model('Item', ItemSchema);
