const mongoose = require("mongoose");

const pointsHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    activityType: {
      type: String,
      required: true,
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
    reference: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    // Unique constraint to prevent duplicate earning
    index: [
      { userId: 1, "reference.platform": 1, "reference.postId": 1 },
      { userId: 1, "reference.referredUserId": 1 },
    ],
  }
);

const PointsHistory = mongoose.model("PointsHistory", pointsHistorySchema);
module.exports = PointsHistory;
