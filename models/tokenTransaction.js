const mongoose = require("mongoose");
require("dotenv").config();
const SYSTEM_ACCOUNT_ID = process.env.SYSTEM_ACCOUNT_ID || "New test";

const tokenTransactionSchema = new mongoose.Schema(
  {
    // Core Transaction Info
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    relatedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    actionType: {
      type: String,
      required: true,
      enum: [
        "social_share",
        "referral_signup",
        "referral_activity",
        "daily_login",
        "game_completion",
        "content_creation",
        "profile_completion",
        "social_verification",
        "streak_bonus",
        "tier_upgrade",
        "purchase",
        "transfer_in",
        "transfer_out",
        "admin_adjustment",
        "reward_redemption",
        "expiration",
        "token_purchase",
        "token_sale",
        "staking_reward",
        "liquidity_provision",
        "airdrop",
        "fork",
        "mining_reward",
      ],
      index: true,
    },
    tokens: {
      type: Number,
      required: true,
      set: (val) => parseFloat(val.toFixed(8)),
    },
    balanceAfter: {
      type: Number,
      required: true,
      set: (val) => parseFloat(val.toFixed(8)),
    },

    // Financial Tracking
    paymentInfo: {
      paymentMethod: {
        type: String,
        enum: [
          "credit_card",
          "paypal",
          "crypto",
          "bank_transfer",
          "mobile_payment",
          "other",
        ],
      },
      transactionId: String,
      amount: Number,
      currency: {
        type: String,
        default: "USD",
      },
      cryptoCurrency: String,
      cryptoAmount: {
        type: Number,
        set: (val) => parseFloat(val.toFixed(8)),
      },
      exchangeRate: Number,
      paymentGateway: String,
      walletAddress: String,
      transactionHash: String,
      blockNumber: Number,
      invoiceId: String,
    },

    // Transfer Specific Fields
    transferDetails: {
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      transferFee: {
        type: Number,
        min: 0,
        default: 0,
        set: (val) => parseFloat(val.toFixed(8)),
      },
      gasFee: {
        type: Number,
        min: 0,
        default: 0,
        set: (val) => parseFloat(val.toFixed(8)),
      },
      message: String,
      memo: String,
    },

    // Enhanced Metadata
    metadata: {
      platform: String,
      postId: String,
      referralCode: String,
      gameId: String,
      itemId: String,
      purchasePackage: String,
      ipAddress: String,
      deviceId: String,
      smartContractAddress: String,
      tokenContractAddress: String,
      blockchainNetwork: String,
    },

    // Status Tracking
    status: {
      type: String,
      enum: [
        "pending",
        "completed",
        "reversed",
        "cancelled",
        "failed",
        "refunded",
        "on_hold",
        "confirmed",
        "unconfirmed",
      ],
      default: "completed",
      index: true,
    },
    statusHistory: [
      {
        status: String,
        changedAt: Date,
        changedBy: mongoose.Schema.Types.ObjectId,
        reason: String,
        blockchainConfirmation: Number,
      },
    ],

    // Timing Information
    processedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
    validFrom: Date,
    blockchainTimestamp: Date,

    // Tier Information
    isTierBoosted: {
      type: Boolean,
      default: false,
    },
    tierMultiplier: {
      type: Number,
      default: 1.0,
      min: 1.0,
      max: 3.0,
    },
    appliedTier: {
      type: String,
      enum: ["bronze", "silver", "gold", "platinum", "diamond"],
    },

    // Security Fields
    requiresApproval: {
      type: Boolean,
      default: false,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvalNotes: String,

    // Audit Trail
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    systemNotes: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    index: [
      { user: 1, actionType: 1, processedAt: -1 },
      { "paymentInfo.transactionId": 1 },
      { "paymentInfo.transactionHash": 1 },
      { "transferDetails.sender": 1, "transferDetails.recipient": 1 },
      { expiresAt: 1, status: 1 },
    ],
  }
);

// Virtual properties
tokenTransactionSchema.virtual("effectiveTokens").get(function () {
  return parseFloat((this.tokens * this.tierMultiplier).toFixed(8));
});

tokenTransactionSchema.virtual("isExpired").get(function () {
  return this.expiresAt && this.expiresAt < new Date();
});

tokenTransactionSchema.virtual("isConfirmed").get(function () {
  return this.status === "confirmed" || this.status === "completed";
});

// Pre-save hook for status history
tokenTransactionSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    this.statusHistory = this.statusHistory || [];
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
      changedBy: this._updatedBy || null,
      reason: this._statusChangeReason || "System update",
      blockchainConfirmation: this._blockchainConfirmations || 0,
    });
  }
  next();
});

/**
 * Custom method to update user tokens with atomic operation
 * @param {ObjectId} userId
 * @param {Number} tokensDelta
 * @param {Object} options
 * @returns {Promise<Number>} new balance
 */
tokenTransactionSchema.statics.updateUserTokens = async function (
  userId,
  tokensDelta,
  options = {}
) {
  const User = mongoose.model("User");
  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { tokens: tokensDelta } },
    { ...options, new: true, select: "tokens" }
  );

  if (!user) throw new Error("User not found");
  return parseFloat(user.tokens);
};

/**
 * Create a token transfer between users
 * @param {ObjectId} senderId
 * @param {ObjectId} recipientId
 * @param {Number} tokens
 * @param {Number} fee
 * @param {Object} options
 * @returns {Object} transaction objects
 */
/**
 * Create a token transfer between users
 * @param {ObjectId} senderId
 * @param {ObjectId} recipientId
 * @param {Number} tokens
 * @param {Number} fee
 * @param {Object} options
 * @returns {Object} transaction objects
 */
tokenTransactionSchema.statics.createTransfer = async function (
  senderId,
  recipientId,
  tokens,
  fee = 0,
  options = {}
) {
  // Validate system account
  if (!SYSTEM_ACCOUNT_ID) throw new Error("System account not configured");

  // Validate input parameters
  if (typeof tokens !== "number" || isNaN(tokens) || tokens <= 0) {
    throw new Error("Tokens must be a positive number");
  }
  if (typeof fee !== "number" || isNaN(fee) || fee < 0) {
    throw new Error("Fee must be a non-negative number");
  }
  if (fee >= tokens) {
    throw new Error("Fee cannot exceed transfer amount");
  }

  // Validate gasFee if provided
  if (
    options.gasFee !== undefined &&
    (typeof options.gasFee !== "number" ||
      isNaN(options.gasFee) ||
      options.gasFee < 0)
  ) {
    throw new Error("Gas fee must be a non-negative number");
  }

  const session = options.session || (await mongoose.startSession());
  const shouldManageTransaction = !options.session;

  try {
    if (shouldManageTransaction) {
      await session.startTransaction();
    }

    // Validate sender balance
    const User = mongoose.model("User");
    const sender = await User.findById(senderId).session(session);
    if (!sender) throw new Error("Sender user not found");

    const senderBalance = parseFloat(sender.token || 0);
    console.log(`Sender`, senderBalance);
    if (isNaN(senderBalance)) {
      throw new Error("Invalid sender token balance");
    }

    const totalDeduction = tokens + (options.gasFee || 0);
    if (senderBalance < totalDeduction) {
      console.error(
        `Insufficient tokens: Need ${totalDeduction}, but only have ${senderBalance}`
      );
      throw new Error(
        `Insufficient tokens. Need ${totalDeduction} but only have ${senderBalance}`
      );
    }

    // Calculate new balances with proper validation
    const senderNewBalance = parseFloat(
      (senderBalance - totalDeduction).toFixed(8)
    );
    if (isNaN(senderNewBalance)) {
      throw new Error("Invalid sender balance calculation");
    }

    const recipient = await User.findById(recipientId).session(session);
    if (!recipient) throw new Error("Recipient user not found");

    const recipientBalance = parseFloat(recipient.tokens || 0);
    const recipientNewBalance = parseFloat(
      (recipientBalance + (tokens - fee)).toFixed(8)
    );
    if (isNaN(recipientNewBalance)) {
      throw new Error("Invalid recipient balance calculation");
    }

    // Create transactions with validated values
    const senderTx = new this({
      user: senderId,
      relatedUser: recipientId,
      actionType: "transfer_out",
      tokens: -totalDeduction,
      balanceAfter: senderNewBalance,
      transferDetails: {
        sender: senderId,
        recipient: recipientId,
        transferFee: fee,
        gasFee: options.gasFee || 0,
        message: options.message,
        memo: options.memo,
      },
      status: "completed",
      metadata: options.metadata,
      _updatedBy: options.actorId,
      _statusChangeReason: options.reason,
    });

    const recipientTx = new this({
      user: recipientId,
      relatedUser: senderId,
      actionType: "transfer_in",
      tokens: tokens - fee,
      balanceAfter: recipientNewBalance,
      transferDetails: {
        sender: senderId,
        recipient: recipientId,
        transferFee: fee,
        gasFee: options.gasFee || 0,
        message: options.message,
        memo: options.memo,
      },
      status: "completed",
      metadata: options.metadata,
      _updatedBy: options.actorId,
      _statusChangeReason: options.reason,
    });

    let feeTx = null;
    if (fee > 0) {
      const systemUser = await User.findById(SYSTEM_ACCOUNT_ID).session(
        session
      );
      if (!systemUser) throw new Error("System account not found");

      const systemBalance = parseFloat(systemUser.tokens || 0);
      const systemNewBalance = parseFloat((systemBalance + fee).toFixed(8));

      feeTx = new this({
        user: SYSTEM_ACCOUNT_ID,
        relatedUser: senderId,
        actionType: "transfer_fee",
        tokens: fee,
        balanceAfter: systemNewBalance,
        transferDetails: {
          sender: senderId,
          recipient: recipientId,
          transferFee: fee,
          gasFee: options.gasFee || 0,
        },
        status: "completed",
        metadata: options.metadata,
      });
    }

    // Save all transactions
    const savePromises = [
      senderTx.save({ session }),
      recipientTx.save({ session }),
    ];
    if (feeTx) savePromises.push(feeTx.save({ session }));
    await Promise.all(savePromises);

    if (shouldManageTransaction) {
      await session.commitTransaction();
    }

    return { senderTx, recipientTx, feeTx };
  } catch (error) {
    if (shouldManageTransaction) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    if (shouldManageTransaction) {
      await session.endSession();
    }
  }
};
const TokenTransaction = mongoose.model(
  "TokenTransaction",
  tokenTransactionSchema
);

module.exports = TokenTransaction;
