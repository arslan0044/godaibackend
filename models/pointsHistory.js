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
      'social_share',
      'referral_signup',
      'referral_activity',
      'daily_login',
      'game_completion',
      'content_creation',
      'profile_completion',
      'social_verification',
      'streak_bonus',
      'tier_upgrade',
      'purchase',          // New - points purchased
      'transfer_in',       // New - received from another user
      'transfer_out',      // New - sent to another user
      'admin_adjustment',  // New - manual adjustment by admin
      'reward_redemption',
      'expiration'
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
