const mongoose = require("mongoose");

const playGameSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true, // Added index for better query performance
  },
  gameId: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  gameName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    default: 0, // Added default value
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true, // Added index for time-based queries
  },
});

// Auto-update createdAt on save
playGameSchema.pre("save", function (next) {
  if (!this.createdAt) {
    this.createdAt = Date.now();
  }
  next();
});
const PlayGame = mongoose.model("PlayGame", playGameSchema);
module.exports = PlayGame;
