const mongoose = require('mongoose');
require("dotenv").config()
const SYSTEM_ACCOUNT_ID = process.env.SYSTEM_ACCOUNT_ID || "New test"
const pointsTransactionSchema = new mongoose.Schema({
  // Core Transaction Info
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  actionType: {
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
      'purchase',
      'transfer_in',
      'transfer_out',
      'admin_adjustment',
      'reward_redemption',
      'expiration'
    ],
    index: true
  },
  points: {
    type: Number,
    required: true,
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value'
    }
  },
  balanceAfter: {
    type: Number,
    required: true
  },

  // Financial Tracking
  paymentInfo: {
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'paypal', 'crypto', 'bank_transfer', 'mobile_payment', 'other']
    },
    transactionId: String,
    amount: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    paymentGateway: String,
    invoiceId: String
  },

  // Transfer Specific Fields
  transferDetails: {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    transferFee: Number,
    message: String
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
    deviceId: String
  },

  // Status Tracking
  status: {
    type: String,
    enum: ['pending', 'completed', 'reversed', 'cancelled', 'failed', 'refunded', 'on_hold'],
    default: 'completed',
    index: true
  },
  statusHistory: [{
    status: String,
    changedAt: Date,
    changedBy: mongoose.Schema.Types.ObjectId,
    reason: String
  }],

  // Timing Information
  processedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: {
    type: Date,
    index: true
  },
  validFrom: Date,

  // Tier Information
  isTierBoosted: {
    type: Boolean,
    default: false
  },
  tierMultiplier: {
    type: Number,
    default: 1.0,
    min: 1.0,
    max: 3.0
  },
  appliedTier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond']
  },

  // Security Fields
  requiresApproval: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalNotes: String,

  // Audit Trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  systemNotes: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  index: [
    { user: 1, actionType: 1, processedAt: -1 },
    { 'paymentInfo.transactionId': 1 },
    { 'transferDetails.sender': 1, 'transferDetails.recipient': 1 },
    { expiresAt: 1, status: 1 }
  ]
});

// Virtual properties
pointsTransactionSchema.virtual('effectivePoints').get(function() {
  return Math.floor(this.points * this.tierMultiplier);
});

pointsTransactionSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Pre-save hook for status history
pointsTransactionSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory = this.statusHistory || [];
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
      changedBy: this._updatedBy || null,
      reason: this._statusChangeReason || 'System update'
    });
  }
  next();
});

/**
 * Custom method to update user points with atomic operation
 * @param {ObjectId} userId 
 * @param {Number} pointsDelta 
 * @param {Object} options 
 * @returns {Promise<Number>} new balance
 */
pointsTransactionSchema.statics.updateUserPoints = async function(userId, pointsDelta, options = {}) {
  const User = mongoose.model('User');
  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { pointsBalance: pointsDelta } },
    { ...options, new: true, select: 'pointsBalance' }
  );
  
  if (!user) throw new Error('User not found');
  return user.pointsBalance;
};

/**
 * Create a points transfer between users
 * @param {ObjectId} senderId 
 * @param {ObjectId} recipientId 
 * @param {Number} points 
 * @param {Number} fee 
 * @param {Object} options 
 * @returns {Object} transaction objects
 */
pointsTransactionSchema.statics.createTransfer = async function(
  senderId, 
  recipientId, 
  points, 
  fee = 0, 
  options = {}
) {
  if (!SYSTEM_ACCOUNT_ID) throw new Error('System account not configured');
  if (points <= 0) throw new Error('Points must be positive');
  if (fee < 0) throw new Error('Fee cannot be negative');
  if (fee >= points) throw new Error('Fee cannot exceed transfer amount');
  
  const session = options.session;
  
  try {
    // Validate sender balance
    const User = mongoose.model('User');
    const sender = await User.findById(senderId).session(session);
    if (!sender) throw new Error('User not found');
    if (sender.pointsBalance < points) {
      throw new Error('Insufficient points');
    }

    // Update balances and get new balances
    const senderNewBalance = await this.updateUserPoints(senderId, -points, { session });
    const recipientNewBalance = await this.updateUserPoints(recipientId, points - fee, { session });
    
    // Create transactions with balanceAfter explicitly set
    const senderTx = new this({
      user: senderId,
      relatedUser: recipientId,
      actionType: 'transfer_out',
      points: -points,
      balanceAfter: senderNewBalance,
      transferDetails: {
        sender: senderId,
        recipient: recipientId,
        transferFee: fee,
        message: options.message
      },
      status: 'completed',
      metadata: options.metadata,
      _updatedBy: options.actorId,
      _statusChangeReason: options.reason
    });

    const recipientTx = new this({
      user: recipientId,
      relatedUser: senderId,
      actionType: 'transfer_in',
      points: points - fee,
      balanceAfter: recipientNewBalance,
      transferDetails: {
        sender: senderId,
        recipient: recipientId,
        transferFee: fee,
        message: options.message
      },
      status: 'completed',
      metadata: options.metadata,
      _updatedBy: options.actorId,
      _statusChangeReason: options.reason
    });

    let feeTx = null;
    if (fee > 0) {
      const systemNewBalance = await this.updateUserPoints(SYSTEM_ACCOUNT_ID, fee, { session });
      feeTx = new this({
        user: SYSTEM_ACCOUNT_ID,
        relatedUser: senderId,
        actionType: 'transfer_fee',
        points: fee,
        balanceAfter: systemNewBalance,
        transferDetails: {
          sender: senderId,
          recipient: recipientId,
          transferFee: fee
        },
        status: 'completed',
        metadata: options.metadata
      });
    }

    // Save all transactions
    const savePromises = [senderTx.save({ session }), recipientTx.save({ session })];
    if (feeTx) savePromises.push(feeTx.save({ session }));
    await Promise.all(savePromises);

    return { senderTx, recipientTx, feeTx };
  } catch (error) {
    throw error;
  }
};
const PointsTransaction = mongoose.model('PointsTransaction', pointsTransactionSchema);

module.exports = PointsTransaction;