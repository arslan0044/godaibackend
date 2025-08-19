const express = require("express");
const { User } = require("../models/user");
const router = express.Router();
const { Faq } = require("../models/Faq");
const bcrypt = require("bcryptjs");
const {
  createPurchasedToken,
  updatePurchasedToken,
  deletePurchasedToken,
} = require("../controllers/PurchasedTokenController");
const Quest = require("../models/quest");

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
    const premium = req.query.premium;
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
    if (premium) {
      query.premium = premium === "true"; // Convert to boolean
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
          path: "CommunityJoin",
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
router.put("/user/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const updateData = req.body;
    const { status } = updateData;
    const {
      name,
      profilePicture,
      goal,
      bio,
      interest,
      gender,
      voice,
      phone,
      tone,
      email,
      ponts,
      token,
      fcmToken,
      password,
      pointsBalance,
      pointsEarned,
    } = updateData;
    if (
      status !== "online" &&
      status !== "deactivated" &&
      status !== "deleted"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid status value. Allowed values are 'online', 'deactivated', or 'deleted'.",
      });
    }
    let hashedPassword;
    console.log(password);
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
      console.log("Hashed Password:", hashedPassword);
    }
    console.log("Hashed Password:", hashedPassword);
    const updateFields = Object.fromEntries(
      Object.entries({
        name,
        profilePicture,
        goal,
        bio,
        interest,
        gender,
        voice,
        phone,
        tone,
        ponts,
        fcmtoken: fcmToken,
        pointsBalance,
        pointsEarned,
        email,
        token,
        password: hashedPassword,
      }).filter(([key, value]) => value !== undefined)
    );
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).send({
        success: false,
        message: "No valid fields provided for update.",
      });
    }
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    // Update user data
    const updatedUser = await User.findByIdAndUpdate(userId, updateFields, {
      new: true,
      runValidators: true,
    }).select("-password -__v -fcmtoken -socialMediaAccounts");
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "Failed to update user",
      });
    }
    res.json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});
router.delete("/user/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete the user
    await User.findByIdAndUpdate(userId, { status: "deleted" }, { new: true });

    res.json({
      success: true,
      message: "User deleted successfully",
      user: {
        _id: user._id,
      },
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
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
    const freeUsers = totalUsers - premiumUsers;
    return res.status(200).json({
      total_users: totalUsers,
      premium_users: premiumUsers,
      totalearning,
      free_users: freeUsers,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.post("/faq", async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }
    const newFaq = new Faq({ title, description });
    await newFaq.save();
    res.status(201).json({
      success: true,
      message: "FAQ created successfully",
      faq: newFaq,
    });
  } catch (error) {
    console.error("Error creating FAQ:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create FAQ",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});
router.put("/faq/:id", async (req, res) => {
  try {
    const faqId = req.params.id;
    const { title, description } = req.body;

    // Validate input
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    // Find and update the FAQ
    const updatedFaq = await Faq.findByIdAndUpdate(
      faqId,
      { title, description },
      { new: true, runValidators: true }
    );

    if (!updatedFaq) {
      return res.status(404).json({
        success: false,
        message: "FAQ not found",
      });
    }

    res.json({
      success: true,
      message: "FAQ updated successfully",
      faq: updatedFaq,
    });
  } catch (error) {
    console.error("Error updating FAQ:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update FAQ",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});
router.delete("/faq/:id", async (req, res) => {
  try {
    const faqId = req.params.id;

    // Find and delete the FAQ
    const deletedFaq = await Faq.findByIdAndDelete(faqId);
    if (!deletedFaq) {
      return res.status(404).json({
        success: false,
        message: "FAQ not found",
      });
    }
    res.json({
      success: true,
      message: "FAQ deleted successfully",
      faq: deletedFaq,
    });
  } catch (error) {
    console.error("Error deleting FAQ:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete FAQ",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});
router.post("/purchased-coin", createPurchasedToken);
router.put("/purchased-coin/:id", updatePurchasedToken);
router.delete("/purchased-coin/:id", deletePurchasedToken);
router.post("/quest", async (req, res) => {
  try {
    const quest = new Quest(req.body);
    await quest.save();
    res.status(201).json(quest);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});



// Update Quest
router.put("/quest/:id", async (req, res) => {
  try {
    const quest = await Quest.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!quest) return res.status(404).json({ error: "Quest not found" });
    res.json(quest);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete Quest
router.delete("/quest/:id", async (req, res) => {
  try {
    const quest = await Quest.findByIdAndDelete(req.params.id);
    if (!quest) return res.status(404).json({ error: "Quest not found" });
    res.json({ message: "Quest deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
