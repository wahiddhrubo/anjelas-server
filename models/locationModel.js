const mongoose = require("mongoose");

const locSchema = mongoose.Schema({
  floorNo: {
    type: Number,
    required: true,
  },
  apartmentNo: {
    type: String,
    required: true,
  },
  streetAddress: {
    type: String,
    required: true,
  },
  area: {
    type: String,
    required: true,
  },
  phone: {
    type: Number,
    required: true,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },

  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Location", locSchema);
