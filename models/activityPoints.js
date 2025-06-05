const mongoose = require("mongoose");
const activityPointsSchema = new mongoose.Schema({
  activityType: {
    type: String,
    required: true,
    unique: true,
    enum: [
      "referral_join",
      "facebook_post",
      "instagram_post",
      "twitter_post",
      "linkedin_post",
      "whatsapp_post",
      "tiktok_post",
      "youtube_post",
      "telegram_post",
    ],
  },
  points: {
    type: Number,
    required: true,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Auto-update updatedAt on save
activityPointsSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// const ActivityPoints = mongoose.model("ActivityPoints", activityPointsSchema);
module.exports = mongoose.model('ActivityPoints', activityPointsSchema);
