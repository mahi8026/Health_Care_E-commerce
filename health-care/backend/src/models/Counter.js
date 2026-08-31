const mongoose = require('mongoose');

/**
 * Generic named counter used for sequential business documents
 * (e.g. fiscal-year invoice numbering). `_id` is the counter name, such as
 * `invoice-2627`. Incremented atomically with findOneAndUpdate + $inc so
 * concurrent order placements can never receive the same number.
 */
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

module.exports = mongoose.model('Counter', counterSchema);