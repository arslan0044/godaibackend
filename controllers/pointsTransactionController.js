const PointsTransaction = require("../models/pointsTransaction");
const TokenTransaction = require("../models/tokenTransaction");
const { User } = require("../models/user");
const mongoose = require("mongoose");
require("dotenv").config();
const ActivityPoints = require("../models/activityPoints");
const PointsHistory = require("../models/pointsHistory");
const CommunityJoin = require("../models/communityJoin");
const SYSTEM_ACCOUNT_ID = process.env.SYSTEM_ACCOUNT_ID || "New test";
/**
 * Transfers points from one user to another.
 *
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The next middleware function.
 */
const transferPoints = async (req, res, next) => {
  const { recipientId, points, message, transferFee = 0 } = req.body;
  const senderId = req.user._id; // Assuming req.user is populated by an authentication middleware

  if (!senderId) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. Sender ID not found.",
    });
  }

  if (!recipientId) {
    return res
      .status(400)
      .json({ success: false, message: "Recipient ID is required." });
  }

  if (senderId.toString() === recipientId.toString()) {
    return res
      .status(400)
      .json({ success: false, message: "Cannot transfer points to yourself." });
  }

  if (typeof points !== "number" || points <= 0 || !Number.isInteger(points)) {
    return res
      .status(400)
      .json({ success: false, message: "Points must be a positive integer." });
  }

  if (
    typeof transferFee !== "number" ||
    transferFee < 0 ||
    !Number.isInteger(transferFee)
  ) {
    return res.status(400).json({
      success: false,
      message: "Transfer fee must be a non-negative integer.",
    });
  }

  if (transferFee >= points) {
    return res.status(400).json({
      success: false,
      message:
        "Transfer fee cannot be equal to or exceed the points being transferred.",
    });
  }

  try {
    // Optional: Verify if recipientId exists before attempting transfer
    const recipientExists = await User.findById(recipientId);
    if (!recipientExists) {
      return res
        .status(404)
        .json({ success: false, message: "Recipient user not found." });
    }

    const { senderTx, recipientTx, feeTx } =
      await PointsTransaction.createTransfer(
        senderId,
        recipientId,
        points,
        transferFee,
        {
          message: message,
          actorId: senderId, // The user performing the action
          reason: "User initiated points transfer",
          metadata: {
            ipAddress: req.ip, // Capture IP address from the request
            platform: req.headers["user-agent"], // Capture user agent for platform info
          },
        }
      );

    res.status(200).json({
      success: true,
      message: "Points transferred successfully.",
      data: {
        senderTransaction: senderTx,
        recipientTransaction: recipientTx,
        feeTransaction: feeTx || null, // Will be null if no fee was applied
      },
    });
  } catch (error) {
    if (error.message === "Insufficient points") {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.message === "User not found") {
      return res.status(404).json({
        success: false,
        message: "Sender or recipient user not found.",
      });
    }
    if (
      error.message === "System account not configured" &&
      !SYSTEM_ACCOUNT_ID
    ) {
      return res.status(500).json({
        success: false,
        message:
          "System account for fees is not configured. Please contact support.",
      });
    }
    console.error("Error during points transfer:", error);
    next(error); // Pass the error to the Express error handling middleware
  }
};

// controllers/communityController.js
// const User = require('../models/user');

const joinCommunity = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { communityType, profileUrl } = req.body;
    const userId = req.user._id;

    // 1. Validate input
    if (!communityType || !profileUrl) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Community type and profile URL are required",
      });
    }

    // 2. Check if community type is valid
    const validPlatforms = [
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
    ];
    const normalizedType = communityType.toLowerCase();

    if (!validPlatforms.includes(normalizedType)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Invalid community type",
      });
    }

    // 3. Check for existing join using the new model (atomic check)
    const existingJoin = await CommunityJoin.findOne({
      user: userId,
      communityType: normalizedType,
    }).session(session);

    if (existingJoin) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `You've already joined our ${normalizedType} community`,
      });
    }

    // 4. Get points configuration
    const activityConfig = await ActivityPoints.findOne({
      activityType: `${normalizedType}_join`,
    }).session(session);

    if (!activityConfig) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Points configuration not found for this community",
      });
    }

    // 5. Update user's social media account and points
    const updateConditions = {
      _id: userId,
      $or: [
        { "socialMediaAccounts.platform": { $ne: normalizedType } },
        {
          "socialMediaAccounts.platform": normalizedType,
          "socialMediaAccounts.isJoined": { $ne: true },
        },
      ],
    };

    const updateOperation = {
      $set: {
        "socialMediaAccounts.$[elem].isJoined": true,
        "socialMediaAccounts.$[elem].profileUrl": profileUrl,
        "socialMediaAccounts.$[elem].isVerified": true,
      },
      $inc: {
        points: activityConfig.points,
        pointsBalance: activityConfig.points,
        pointsEarned: activityConfig.points,
      },
    };

    const arrayFilters = [{ "elem.platform": normalizedType }];

    const updatedUser = await User.findOneAndUpdate(
      updateConditions,
      updateOperation,
      {
        arrayFilters,
        new: true,
        session,
        upsert: false, // Important for atomic operation
      }
    );

    // If no matching document was found to update
    if (!updatedUser) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `You've already joined our ${normalizedType} community`,
      });
    }

    // 6. Create community join record
    await CommunityJoin.create(
      [
        {
          user: userId,
          communityType: normalizedType,
          profileUrl: profileUrl,
          pointsEarned: activityConfig.points,
        },
      ],
      { session }
    );

    // 7. Create points history record
    await PointsHistory.create(
      [
        {
          userId: userId,
          activityType: `${normalizedType}_join`,
          points: activityConfig.points,
          reference: {
            profileUrl: profileUrl,
            type: "community_join",
          },
        },
      ],
      { session }
    );

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();
    const communities = await CommunityJoin.find({ user: userId }).lean();

    res.status(200).json({
      success: true,
      user: updatedUser,
      message: `Successfully joined ${normalizedType} community`,
      pointsEarned: activityConfig.points,
      totalPoints: updatedUser.points,
      communities: communities,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    // console.error("Error in community-join:", error);

    if (error.code === 11000) {
      // Duplicate key error
      return res.status(400).json({
        success: false,
        message: `You've already joined this community`,
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const transferTokens = async (req, res, next) => {
  const {
    recipientId,
    tokens,
    message,
    memo,
    transferFee = 0,
    gasFee = 0,
  } = req.body;
  const senderId = req.user._id;

  // Input validation
  if (!senderId) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. Sender ID not found.",
    });
  }

  if (!recipientId) {
    return res.status(400).json({
      success: false,
      message: "Recipient ID is required.",
    });
  }

  if (senderId.toString() === recipientId.toString()) {
    return res.status(400).json({
      success: false,
      message: "Cannot transfer tokens to yourself.",
    });
  }

  if (typeof tokens !== "number" || isNaN(tokens) || tokens <= 0) {
    return res.status(400).json({
      success: false,
      message: "Tokens must be a positive number.",
    });
  }

  if (
    typeof transferFee !== "number" ||
    isNaN(transferFee) ||
    transferFee < 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Transfer fee must be a non-negative number.",
    });
  }

  if (typeof gasFee !== "number" || isNaN(gasFee) || gasFee < 0) {
    return res.status(400).json({
      success: false,
      message: "Gas fee must be a non-negative number.",
    });
  }

  if (transferFee >= tokens) {
    return res.status(400).json({
      success: false,
      message:
        "Transfer fee cannot be equal to or exceed the tokens being transferred.",
    });
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // Verify recipient exists
      const recipientExists = await User.findById(recipientId).session(session);
      if (!recipientExists) {
        throw new Error("Recipient user not found");
      }

      // Verify sender exists and has sufficient balance
      const sender = await User.findById(senderId).session(session);
      if (!sender) {
        throw new Error("Sender user not found");
      }

      const totalDeduction = parseFloat((tokens + gasFee).toFixed(8));
      if (sender.token < totalDeduction) {
        throw new Error(
          `Insufficient token balance. Need ${totalDeduction} but only have ${sender.token}`
        );
      }

      // Prepare transfer options
      const transferOptions = {
        message: message,
        memo: memo,
        gasFee: parseFloat(gasFee.toFixed(8)),
        actorId: senderId,
        reason: "User initiated token transfer",
        metadata: {
          ipAddress: req.ip,
          platform: req.headers["user-agent"],
          walletAddress: sender.walletAddress,
          blockchainNetwork: process.env.BLOCKCHAIN_NETWORK || "mainnet",
        },
        session: session,
      };

      // Execute transfer
      const { senderTx, recipientTx, feeTx } =
        await TokenTransaction.createTransfer(
          senderId,
          recipientId,
          parseFloat(tokens.toFixed(8)),
          parseFloat(transferFee.toFixed(8)),
          transferOptions
        );

      // Success response
      res.status(200).json({
        success: true,
        message: "Tokens transferred successfully.",
        data: {
          senderTransaction: senderTx,
          recipientTransaction: recipientTx,
          feeTransaction: feeTx || null,
          networkFee: parseFloat(gasFee.toFixed(8)),
          totalDeduction: totalDeduction,
        },
      });
    });
  } catch (error) {
    console.error("Error during token transfer:", error);

    // Handle specific errors
    if (error.message.includes("Insufficient token balance")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    if (error.message.includes("user not found")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    if (error.message === "System account not configured") {
      return res.status(500).json({
        success: false,
        message:
          "System account for fees is not configured. Please contact support.",
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      message: "An unexpected error occurred during token transfer.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    await session.endSession();
  }
};

module.exports = {
  transferPoints,
  joinCommunity,
  transferTokens,
};
