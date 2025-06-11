const PointsTransaction = require("../models/pointsTransaction");
const {User} = require("../models/user");
const mongoose = require("mongoose");
require("dotenv").config();
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
    return res
      .status(401)
      .json({
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
    return res
      .status(400)
      .json({
        success: false,
        message: "Transfer fee must be a non-negative integer.",
      });
  }

  if (transferFee >= points) {
    return res
      .status(400)
      .json({
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
      return res
        .status(404)
        .json({
          success: false,
          message: "Sender or recipient user not found.",
        });
    }
    if (
      error.message === "System account not configured" &&
      !SYSTEM_ACCOUNT_ID
    ) {
      return res
        .status(500)
        .json({
          success: false,
          message:
            "System account for fees is not configured. Please contact support.",
        });
    }
    console.error("Error during points transfer:", error);
    next(error); // Pass the error to the Express error handling middleware
  }
};

module.exports = {
  transferPoints,
};
