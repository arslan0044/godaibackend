const PlayGame = require("../models/PlayGame");
const ActivityPoints = require("../models/activityPoints");
const { User } = require("../models/user");
const mongoose = require("mongoose");

exports.playGame = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { gameId, gameName } = req.body;
    const userId = req.user._id;

    // Enhanced input validation
    if (!gameId || !gameName) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Game ID and name are required.",
      });
    }

    if (typeof gameId !== "string" || gameId.length > 50) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Invalid game ID format.",
      });
    }

    if (typeof gameName !== "string" || gameName.length > 100) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Game name must be a string with max 100 characters.",
      });
    }

    // Check if user already played this game in last 24 hours and received points
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const existingPlay = await PlayGame.findOne({
      userId,
      // gameId,
      score: { $gt: 0 }, // Only check plays that awarded points
      createdAt: { $gte: twentyFourHoursAgo },
    }).session(session);

    if (existingPlay) {
      await session.abortTransaction();
      return res.status(200).json({
        success: true,
        message:
          "Game played successfully, but no points awarded (already received points within 24 hours).",
        data: {
          userId,
          gameId,
          gameName,
          score: 0,
          createdAt: existingPlay.createdAt,
        },
      });
    }

    // Get score with session for transaction consistency
    const activity = await ActivityPoints.findOne({
      activityType: "play_game",
    }).session(session);

    const score = activity ? activity.points : 0;

    // Create a new PlayGame entry
    const playGameEntry = new PlayGame({
      userId,
      gameId,
      gameName,
      score,
    });

    await playGameEntry.save({ session });
    if (score > 0) {
      // Update user's points
      await User.updateOne(
        { _id: userId },
        { $inc: { points: score, pointsBalance: score } },
        { session }
      );
    }

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message:
        score > 0
          ? "Game played successfully and points awarded."
          : "Game played successfully but no points awarded.",
      data: playGameEntry,
    });
  } catch (error) {
    await session.abortTransaction();

    console.error("Error playing game:", error);
    res.status(500).json({
      success: false,
      message: "Failed to play game.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    session.endSession();
  }
};
