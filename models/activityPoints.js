const mongoose = require("mongoose");
const activityPointsSchema = new mongoose.Schema({
  activityType: {
    type: String,
    required: true,
    unique: true,
    enum: [
      "referral_signup",
      "referral_join",
      "daily_login",
      "play_game",
      "listen_music",
      "watch_video",
      "facebook_join",
      "instagram_join",
      "twitter_join",
      "linkedin_join",
      "tiktok_join",
      "youtube_join",
      "whatsapp_join",
      "telegram_join",
      "webxv_join",
      "discord_join",
      "token_purchase",
      "reminder_price",
      "watch_trailer",
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
module.exports = mongoose.model("ActivityPoints", activityPointsSchema);
