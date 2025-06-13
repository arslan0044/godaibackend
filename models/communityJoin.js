// models/communityJoin.js
const mongoose = require("mongoose");

const communityJoinSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    communityType: {
      type: String,
      required: true,
      enum: [
        "facebook",
        "instagram",
        "twitter",
        "linkedin",
        "tiktok",
        "youtube",
        "whatsapp",
        "telegram",
        "webxv",
        "discord",
      ],
      index: true,
    },
    profileUrl: {
      type: String,
      required: true,
    },
    pointsEarned: {
      type: Number,
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate joins
communityJoinSchema.index({ user: 1, communityType: 1 }, { unique: true });

module.exports = mongoose.model("CommunityJoin", communityJoinSchema);
