const mongoose = require("mongoose");

const orderSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  uID: {
    type: String,
    required: true,
  },
  location: {
    type: mongoose.Schema.ObjectId,
    ref: "Location",
    required: true,
  },
  items: [
    {
      item: {
        type: mongoose.Schema.ObjectId,
        ref: "Item",
        required: true,
      },
      pricePerUnit: {
        type: Number,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        max: 100,
      },
      variant: {
        type: String,
        // required: true,
      },
    },
  ],
  deliveryDate: {
    type: Date,
    required: true,
  },
  deliveryTime: {
    type: String,
    required: true,
  },
  subTotal: {
    type: Number,
    required: true,
  },
  tax: {
    type: Number,
    required: true,
  },
  deliveryCharge: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
  },
  coupon: {
    type: String,
  },
  paymentMethod: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: "processing",
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Order", orderSchema);
