const mongoose = require("mongoose");

const purchasedTokenSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  tokkens: {
    type: Number,
    required: true,
    trim: true,
  },
});

const PurchasedToken = mongoose.model("PurchasedToken", purchasedTokenSchema);
module.exports = PurchasedToken;
