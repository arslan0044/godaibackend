// controllers/referralController.js
const { User } = require("../models/user");
const { generateReferralCode } = require("../utils/referralUtils");
// const { PointsTransaction } = require("../models/pointsTransaction");
// const PointConfig = require('../models/pointConfig');
const ActivityPoints = require("../models/activityPoints");

const generateReferralLink = async (req, res) => {
  try {
    const userId = req.user._id; // Assuming you're using authentication middleware

    // Find user and check if they already have a referral code
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Generate new referral code if doesn't exist
    if (!user.referralCode) {
      let referralCode;
      let isUnique = false;

      // Ensure referral code is unique
      while (!isUnique) {
        referralCode = generateReferralCode();
        const existingUser = await User.findOne({ referralCode });
        if (!existingUser) {
          isUnique = true;
        }
      }

      user.referralCode = referralCode;
      await user.save();
    }

    // Construct the referral link
    const baseUrl = process.env.MainDomain || "yourdomain.com";
    const referralLink = `https://${baseUrl}/auth/signup?ref=${user.referralCode}`;

    res.status(200).json({
      success: true,
      referralCode: user.referralCode,
      referralLink,
      message: "Referral link generated successfully",
    });
  } catch (error) {
    console.error("Error generating referral link:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * @desc   Create new activity points configuration
 * @route  POST /api/admin/activity-points
 * @access Private/Admin
 */
const createActivityPoints = async (req, res) => {
  // const errors = validationResult(req);
  // if (!errors.isEmpty()) {
  //   return res.status(400).json({ errors: errors.array() });
  // }

  try {
    const { activityType, points } = req.body;

    // Check for existing configuration
    const existingConfig = await ActivityPoints.findOne({ activityType });
    if (existingConfig) {
      return res.status(400).json({
        success: false,
        message: `Activity points configuration for ${activityType} already exists`,
      });
    }

    const newConfig = await ActivityPoints.create({
      activityType,
      points,
    });

    res.status(201).json({
      success: true,
      data: newConfig,
    });
  } catch (error) {
    console.error("Error creating activity points:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * @desc   Get all activity points configurations with filtering
 * @route  GET /api/admin/activity-points
 * @access Private/Admin
 * @param  {String} [activityType] - Filter by specific activity type
 * @param  {Number} [minPoints] - Filter by minimum points value
 * @param  {Number} [maxPoints] - Filter by maximum points value
 * @param  {Date} [updatedAfter] - Filter by last update date (ISO format)
 */
const getActivityPoints = async (req, res) => {
  try {
    const { activityType, minPoints, maxPoints, updatedAfter } = req.query;

    // Build filter object
    const filter = {};

    if (activityType) {
      filter.activityType = {
        $in: Array.isArray(activityType) ? activityType : [activityType],
      };
    }

    if (minPoints || maxPoints) {
      filter.points = {};
      if (minPoints) filter.points.$gte = Number(minPoints);
      if (maxPoints) filter.points.$lte = Number(maxPoints);
    }

    if (updatedAfter) {
      filter.updatedAt = { $gte: new Date(updatedAfter) };
    }

    const activityPoints = await ActivityPoints.find(filter).sort({
      updatedAt: -1,
    });

    res.status(200).json({
      success: true,
      count: activityPoints.length,
      data: activityPoints,
    });
  } catch (error) {
    console.error("Error fetching activity points:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * @desc   Get single activity points configuration
 * @route  GET /api/admin/activity-points/:id
 * @access Private/Admin
 */
const getSingleActivityPoint = async (req, res) => {
  try {
    const config = await ActivityPoints.findById(req.params.id);

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Activity points configuration not found",
      });
    }

    res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error("Error fetching activity point:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * @desc   Update activity points configuration
 * @route  PUT /api/admin/activity-points/:id
 * @access Private/Admin
 */
const updateActivityPoints = async (req, res) => {
  // const errors = validationResult(req);
  // if (!errors.isEmpty()) {
  //   return res.status(400).json({ errors: errors.array() });
  // }

  try {
    const { points } = req.body;

    const updatedConfig = await ActivityPoints.findByIdAndUpdate(
      req.params.id,
      { points },
      { new: true, runValidators: true }
    );

    if (!updatedConfig) {
      return res.status(404).json({
        success: false,
        message: "Activity points configuration not found",
      });
    }

    res.status(200).json({
      success: true,
      data: updatedConfig,
    });
  } catch (error) {
    console.error("Error updating activity points:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * @desc   Delete activity points configuration
 * @route  DELETE /api/admin/activity-points/:id
 * @access Private/Admin
 */
const deleteActivityPoints = async (req, res) => {
  try {
    const deletedConfig = await ActivityPoints.findByIdAndDelete(req.params.id);

    if (!deletedConfig) {
      return res.status(404).json({
        success: false,
        message: "Activity points configuration not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Activity points configuration deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting activity points:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  createActivityPoints,
  getActivityPoints,
  getSingleActivityPoint,
  updateActivityPoints,
  deleteActivityPoints,
  generateReferralLink,
};
