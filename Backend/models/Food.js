const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  category: {
    type: String,
    required: true
  },

  quantity: {
    type: Number,
    required: true
  },

  expiryDate: {
    type: Date,
    required: true
  }
});

module.exports = mongoose.model("Food", foodSchema);