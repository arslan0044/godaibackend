const mongoose = require("mongoose");

const questSchema = new mongoose.Schema({
  title: String,
  description: String, // fixed spelling
  // points: Number,
  type: String,
  // data: mongoose.Schema.Types.Mixed,
});

const Quest = mongoose.model("Quest", questSchema);

module.exports = Quest;
