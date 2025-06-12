const express = require("express");
const { User } = require("../models/user");
const router = express.Router();

/**
 * @route GET /api/admin/get-all-users
 * @description Get paginated list of users with filtering and sorting
 * @access Protected (typically admin-only)
 * @param {number} [page=1] - Page number
 * @param {number} [limit=10] - Users per page
 * @param {string} [search] - Search term (name, email, phone)
 * @param {string} [sort=-createdAt] - Sort field (-field for desc)
 * @param {string} [status] - Filter by status
 * @param {string} [tier] - Filter by tier
 * @returns {Object} Paginated user list
 */
router.get("/get-all-users", async (req, res) => {
  try {
    // Parse query parameters with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || "-createdAt";
    const search = req.query.search;
    const status = req.query.status;
    const tier = req.query.tier;

    // Build the query
    const query = {};

    // Search filter (name, email, or phone)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Tier filter
    if (tier) {
      query.tier = tier;
    }

    // Get total count for pagination
    const total = await User.countDocuments(query);

    // Get paginated users (excluding sensitive fields)
    const users = await User.find(query)
      .select("-password -__v -fcmtoken -socialMediaAccounts.accessToken")
      .populate("communityJoin")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Transform user data if needed
    const transformedUsers = users.map((user) => ({
      ...user,
      // Add any computed fields here
      fullReferralLink: `http://${process.env.MainDomain}/ref/${user.referralCode}`,
    }));

    res.json({
      success: true,
      data: transformedUsers,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});
/**
 * @route GET /api/admin/user/:id
 * @description Get complete details for a single user
 * @access Protected (admin or the user themselves)
 * @param {string} id - User ID
 * @returns {Object} Complete user details with all relationships
 */
router.get("/user/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    // Get user with maximum details
    const user = await User.findById(userId)
      .select("-__v -socialMediaAccounts.accessToken -password") // Always exclude sensitive fields
      .populate([
        {
          path: "referredBy",
          select: "name email profilePicture",
        },
        {
          path: "referralStats.activeReferrals",
          select: "name email createdAt points",
        },
        {
          path: "communityJoin",
          select: "communityType joinedAt pointsEarned",
        },
        {
          path: "pointsHistory",
          options: { sort: { createdAt: -1 }, limit: 10 },
        },
      ])
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Add computed fields
    const enrichedUser = {
      ...user,
      fullReferralLink: `http://${process.env.MainDomain}/ref/${user.referralCode}`,
      socialMediaAccounts: user.socialMediaAccounts.map((account) => ({
        ...account,
        isConnected: !!account.accessToken,
      })),
      // Add more computed fields as needed
    };

    // For admin requests, include additional sensitive info
    // if (isAdmin) {
    //   enrichedUser.adminView = {
    //     lastLoginIp: user.devices?.[0]?.ipAddress,
    //     accountStatus: user.status,
    //     // Other admin-only fields
    //   };
    // }

    res.json({
      success: true,
      data: enrichedUser,
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user details",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});
router.get("/", async (req, res) => {
  try {
    const [totalUsers, premiumUsers] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ premium: true }),
    ]);

    const totalearning = premiumUsers * 120;

    return res.status(200).json({
      total_users: totalUsers,
      premium_users: premiumUsers,
      totalearning,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});
module.exports = router;
