// ✅ models/Item.js
const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  itemCode: { type: String, required: true, index: true },
  packing:  { type: Number, default: 0 },
  yards:    { 
    type: Number, 
    default: 0,
    set: v => Math.round(Number(v) * 100) / 100  // normalize on write
  }
});


module.exports = mongoose.model('Item', ItemSchema);
