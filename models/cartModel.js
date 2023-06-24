const mongoose = require("mongoose");

const locSchema = mongoose.Schema({
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

  updated_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Cart", locSchema);
