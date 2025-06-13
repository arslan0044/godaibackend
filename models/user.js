const jwt = require("jsonwebtoken");
const Joi = require("joi");
const config = require("config");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    minlength: 0,
    maxlength: 1024,
  },
  devicerid: String,
  phone: String,
  voice: String,
  tone: String,
  bio: String,
  interest: String,
  email: {
    type: String,
    required: false,
    default: null,
    minlength: 5,
    maxlength: 255,
  },
  password: {
    type: String,
    required: false,
    minlength: 0,
    maxlength: 1024,
  },
  profilePicture: {
    type: String,
    required: false,
    default:
      "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop",
  },
  code: {
    type: Number,
    minlength: 0,
    maxlength: 4,
  },
  status: {
    type: String,
    default: "online",
    enum: ["online", "deleted", "deactivated"],
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
    default: "Other",
  },
  type: {
    type: String,
    default: "customer",
    enum: ["customer", "admin"],
  },
  login_type: {
    type: String,
    default: "email",
    enum: ["email", "social-login"],
  },
  verify: {
    type: Boolean,
    default: false,
  },
  fcmtoken: String,
  goal: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
  },
  points: {
    type: Number,
    default: 0,
    min: 0,
  },
  socialMediaAccounts: [
    {
      platform: {
        type: String,
        enum: [
          "facebook",
          "instagram",
          "twitter",
          "linkedin",
          "tiktok",
          "youtube",
          "whatsapp",
          "telegram",
          "discord",
        ],
      },
      accountId: String,
      accessToken: String,
      // refreshToken: String,
      username: String,
      profileUrl: String,
      lastSynced: Date,
      isVerified: { type: Boolean, default: false },
    },
  ],
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  communityJoin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CommunityJoin",
  },
  pointsHistory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PointsHistory",
  },
  referralCount: {
    type: Number,
    default: 0,
  },
  token: {
    type: Number,
    default: 0,
    min: 0, 
    set: (val) => parseFloat(val.toFixed(8)), // For crypto decimal precision
  },
  tokenTransactions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TokenTransaction",
    },
  ],
  tokenWalletAddress: String,
  lastLogin: Date,
  pointsEarned: {
    type: Number,
    default: 0,
  },
  pointsBalance: {
    type: Number,
    default: 0, // IMPORTANT: New users will start with 0 points
    min: 0, // Optional: Prevent negative balances
  },
  pointsRedeemed: {
    type: Number,
    default: 0,
  },
  referralStats: {
    totalReferrals: { type: Number, default: 0 },
    activeReferrals: { type: Number, default: 0 },
    convertedReferrals: { type: Number, default: 0 },
  },
  tier: {
    type: String,
    enum: ["bronze", "silver", "gold", "platinum"],
    default: "bronze",
  },
  premium: {
    type: Boolean,
    require: false,
    default: false,
  },
  lastActivity: Date,
  notificationPreferences: {
    referralAlerts: { type: Boolean, default: true },
    pointsUpdates: { type: Boolean, default: true },
    rewardOffers: { type: Boolean, default: true },
  },
});

function generateAuthToken(_id, type) {
  const token = jwt.sign({ _id: _id, type: type }, config.get("jwtPrivateKey"));
  return token;
}
function generateIdToken(_id) {
  const expiresIn = 3600; // Token will expire in 1 hour (3600 seconds)
  const token = jwt.sign({ _id: _id }, config.get("jwtIDPrivateKey"), {
    expiresIn,
  });
  return token;
}

const User = mongoose.model("User", userSchema);

function validateUser(user) {
  const commonSchema = {
    name: Joi.string().min(2).max(50).required(),
    phone: Joi.string().min(2).max(50).required(),
    password: Joi.string().min(5).max(255).required(),
    email: Joi.string().min(5).max(255).email(),
    voice: Joi.string().min(0).max(1024).optional(),
    tone: Joi.string().min(0).max(1024).optional(),
    fcmtoken: Joi.string().min(0).max(1024).optional(),
    profilePicture: Joi.string().min(0).max(1024).optional(),
    bio: Joi.string().min(0).max(1024).optional(),
    interest: Joi.string().min(0).max(1024).optional(),
    gender: Joi.string().optional(),
    referralCode: Joi.string().min(0).max(1024).optional(),
  };

  const schema = Joi.object({
    ...commonSchema,
  });

  return schema.validate(user);
}

function passwordApiBodyValidate(body) {
  const schema = Joi.object({
    password: Joi.string().min(5).max(255).required(),
    token: Joi.string().min(5).max(255).required(),
  });

  return schema.validate(body);
}

function phoneApiBodyValidate(body) {
  const schema = Joi.object({
    phone: Joi.string().min(4).max(50).required(),
  });

  return schema.validate(body);
}

function validateCodeUser(body) {
  const schema = Joi.object({
    email: Joi.string().min(4).max(50).required(),
  });

  return schema.validate(body);
}

exports.User = User;
exports.validate = validateUser;
exports.generateAuthToken = generateAuthToken;
exports.generateIdToken = generateIdToken;
exports.passwordApiBodyValidate = passwordApiBodyValidate;
exports.validateCodeUser = validateCodeUser;
exports.phoneApiBodyValidate = phoneApiBodyValidate;
