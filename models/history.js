const mongooes = require("mongoose");

const historySchema = new mongooes.Schema({
  userId: {
    type: mongooes.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  action: String,
  description: String,
  isDeleted: Boolean,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: Date,
});
historySchema.index({ userId: 1, createdAt: -1 }); // For general queries
historySchema.index({ userId: 1, action: 1 }); // If action filtering is common
const History = mongooes.model("History", historySchema);
module.exports = History;
