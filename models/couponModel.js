const mongoose = require("mongoose");

const couponSchema = mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  discountType: {
    type: String,
    required: true,
  },
  discount: {
    type: Number,
    required: true,
  },
  brakingAmount: {
    type: Number,
    default: 0,
    required: true,
  },
  firstOrder: {
    type: Boolean,
    required: true,
    default: false,
  },
  maxUses: {
    type: Number,
    required: true,
  },
  totalUses: {
    type: Number,
  },
  expires: {
    type: Date,
    required: true,
  },
  featured: {
    type: Boolean,
  },
  featuredImage: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    created_at: {
      type: Date,
    },
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("COupon", couponSchema);
