const mongooes = require("mongoose");

const packagesSchema = new mongooes.Schema({
  name: {
    type: String,
  },
  paymentId: {
    type: String,
  },
  timePeriod: {
    type: String,
  },
  price: {
    type: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
const Package = mongooes.model("Package", packagesSchema);

module.exports = Package;
