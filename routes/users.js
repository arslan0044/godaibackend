const auth = require("../middleware/auth");
const bcrypt = require("bcryptjs");
const _ = require("lodash");
const {
  User,
  validate,
  validateCodeUser,
  generateAuthToken,
  passwordApiBodyValidate,
  generateIdToken,
} = require("../models/user");
const express = require("express");
const { sendEmail } = require("../controllers/emailservice");
const passwordauth = require("../middleware/passwordauth");
const { generateCode } = require("../controllers/generateCode");
const router = express.Router();
const ActivityPoints = require("../models/activityPoints");
const PointsHistory = require("../models/pointsHistory");
const Package = require("../models/packages");
const History = require("../models/history");
const { TempUser } = require("../models/TempUser");
const { generateReferralCode } = require("../utils/referralUtils");
const communityJoin = require("../models/communityJoin");
const { playGame } = require("../controllers/gameController");
const admin = require("../middleware/admin");
const mongooes = require("mongoose");
router.post("/play-game", auth, playGame);
router.get("/me", auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const [user, referralUsers, userCommunities] = await Promise.all([
      // Get user data
      User.findById(userId).select("-password").lean(),

      // Get referral users
      User.find({ referredBy: userId })
        .select(
          "name email pointsBalance profilePicture points premium createdAt"
        )
        .lean(),

      // Get communities the user has joined
      communityJoin.find({ user: userId }).lean(),
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Construct response
    const response = {
      success: true,
      user: {
        ...user,
        referrals: {
          count: referralUsers.length,
          users: referralUsers,
          totalPointsEarned: user.referralStats?.pointsEarnedFromReferrals || 0,
        },
        communityStats: {
          joinedCount: userCommunities.length,
          communities: userCommunities,
        },
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error in /me endpoint:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.post("/forget-password", async (req, res) => {
  const { error } = validateCodeUser(req.body);

  if (error) return res.status(400).send({ message: error.details[0].message });

  const { email } = req.body;
  const lowerCaseEmail = String(email).trim().toLocaleLowerCase();

  const user = await User.findOne({ email: lowerCaseEmail });

  if (!user)
    return res
      .status(400)
      .send({ message: "User is not registered with that Email" });

  if (user.status == "deleted")
    return res.status(400).send({
      message: "User has been deleted. Contact admin for further support.",
    });

  const verificationCode = generateCode();

  await sendEmail(email, verificationCode);
  await User.findOneAndUpdate(
    { email: lowerCaseEmail },
    { code: verificationCode }
  );

  const token = generateIdToken(user._id);

  res.send({
    success: true,
    message: "Verification code sent successfully",
    token,
    verificationCode,
  });
});

router.put("/update-password", passwordauth, async (req, res) => {
  const { error } = passwordApiBodyValidate(req.body);
  if (error)
    return res
      .status(400)
      .send({ success: false, message: error.details[0].message });

  const { password } = req.body;

  const user = await User.findById(req.user._id);

  if (!user)
    return res.status(404).send({
      success: false,
      message: "The User with the given ID was not found.",
    });

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  user.password = hashedPassword;

  await user.save();

  res.send({ success: true, message: "Password updated successfully" });
});

router.put("/change-password", auth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);

  if (!user)
    return res.status(404).send({
      success: false,
      message: "The User with the given ID was not found.",
    });

  const validPassword = await bcrypt.compare(oldPassword, user.password);
  if (!validPassword)
    return res
      .status(400)
      .send({ success: false, message: "Invalid password" });

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  user.password = hashedPassword;

  await user.save();

  res.send({ success: true, message: "Password updated successfully" });
});

router.post("/send-code", async (req, res) => {
  const { email } = req.body;
  const lowerCaseEmail = String(email).trim().toLocaleLowerCase();

  try {
    const existingUser = await User.findOne({ email: lowerCaseEmail });

    if (!existingUser) {
      return res
        .status(409)
        .json({ error: `This email ${email} is not registered` });
    }

    const verificationCode = generateCode();
    await sendEmail(email, verificationCode);

    const existingTempUser = await TempUser.findOne({ email: lowerCaseEmail });
    if (existingTempUser) {
      await TempUser.findByIdAndUpdate(existingTempUser._id, {
        code: verificationCode,
      });
    } else {
      const tempVerification = new TempUser({
        email: lowerCaseEmail,
        code: verificationCode,
      });
      await tempVerification.save();
    }

    return res.json({
      message: "Verification code sent successfully",
      verificationCode,
    });
  } catch (error) {
    console.error("Error sending verification code:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/verify-otp/registration", async (req, res) => {
  try {
    const { email, code } = req.body;
    const lowerCaseEmail = String(email).trim().toLocaleLowerCase();

    const verificationRecord = await TempUser.findOne({
      email: lowerCaseEmail,
    });

    if (!verificationRecord || verificationRecord.code !== code) {
      return res
        .status(200)
        .json({ success: false, message: "Incorrect verification code" });
    }
    await User.findOneAndUpdate({ email: lowerCaseEmail }, { verify: true });

    return res.json({
      success: true,
      message: "Verification code match successfully",
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/signup", async (req, res) => {
  const { error } = validate(req.body);
  if (error)
    return res
      .status(400)
      .send({ success: false, message: error.details[0].message });

  const {
    name,
    password,
    email,
    fcmtoken,
    phone,
    voice,
    tone,
    bio,
    interest,
    referralCode,
  } = req.body;

  const lowerCaseEmail = String(email).trim().toLocaleLowerCase();

  // const verificationRecord = await TempUser.findOne({ email: lowerCaseEmail });

  // if (verificationRecord) {
  //   return res
  //     .status(200)
  //     .json({ success: false, message: "Verification is not completed" });
  // }

  const user = await User.findOne({ email: lowerCaseEmail });

  if (user)
    return res
      .status(400)
      .send({ success: false, message: "Email already registered" });

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = new User({
    password: hashedPassword,
    name,
    email: lowerCaseEmail,
    fcmtoken,
    phone,
    voice,
    tone,
    bio,
    interest,
  });

  // Referral code handling
  if (referralCode) {
    try {
      // 1. Find referrer by referral code
      const referrer = await User.findOne({ referralCode });

      if (!referrer) {
        return res.status(400).json({
          success: false,
          message: "Invalid referral code",
        });
      }

      // 2. Get referral points configuration
      const referralConfig = await ActivityPoints.findOne({
        activityType: "referral_join",
      });

      if (!referralConfig) {
        console.error("Referral points configuration not found");
        // Continue without referral points if config missing
      } else {
        // 3. Update referrer's points
        await User.findByIdAndUpdate(referrer._id, {
          $inc: {
            points: referralConfig.points,
            pointsBalance: referralConfig.points,
            pointsEarned: referralConfig.points,
            referralCount: 1,
            "referralStats.totalReferrals": 1,
          },
        });

        // 4. Create points history record
        await PointsHistory.create({
          userId: referrer._id,
          activityType: "referral_join",
          points: referralConfig.points,
          reference: {
            referredUserId: newUser._id,
            type: "user",
          },
        });

        // 5. Set referredBy for new user
        newUser.referredBy = referrer._id;
      }
    } catch (err) {
      console.error("Error processing referral:", err);
      // Continue with signup even if referral processing fails
    }
  }

  await newUser.save();

  // Generate referral code for the new user if not exists
  if (!newUser.referralCode) {
    newUser.referralCode = generateReferralCode(newUser._id);
    const referralConfig = await ActivityPoints.findOne({
      activityType: "referral_signup",
    });
    newUser.points = referralConfig.points;
    newUser.pointsBalance = referralConfig.points;
    newUser.pointsRedeemed = referralConfig.points;
    await newUser.save();
  }

  await TempUser.deleteOne({ email: lowerCaseEmail });
  const token = generateAuthToken(newUser._id, newUser.type);

  res.send({
    success: true,
    message: "Account created successfully",
    token: token,
    user: newUser,
  });
});

router.post("/verify-otp/forget-password", passwordauth, async (req, res) => {
  try {
    const { code } = req.body;

    const user = await User.findById(req.user._id);

    if (!user)
      return res.status(200).send({
        success: false,
        message: "The User with the given ID was not found.",
      });

    if (Number(user.code) !== Number(code))
      return res
        .status(200)
        .send({ success: false, message: "Incorrect code." });

    return res.json({
      success: true,
      message: "Verification code match successfully",
    });
  } catch (error) {
    console.error("Error sending verification code:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/check-email", async (req, res) => {
  const { error } = validateCodeUser(req.body);
  if (error)
    return res
      .status(400)
      .send({ success: false, message: error.details[0].message });

  const { email } = req.body;
  const lowerCaseEmail = String(email).trim().toLocaleLowerCase();

  const user = await User.findOne({ email: lowerCaseEmail });
  if (user)
    return res
      .status(400)
      .send({ success: false, message: "Email already existed" });

  res.send({ success: true, message: "Email doesn't existed" });
});

router.put("/update-user", auth, async (req, res) => {
  try {
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
      pointsBalance,
      pointsEarned,
    } = req.body;

    // Create an object to store the fields to be updated
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
      }).filter(([key, value]) => value !== undefined)
    );
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).send({
        success: false,
        message: "No valid fields provided for update.",
      });
    }
    const user = await User.findByIdAndUpdate(req.user._id, updateFields, {
      new: true,
    });

    if (!user)
      return res.status(404).send({
        success: false,
        message: "The User with the given ID was not found.",
      });

    res.send({ success: true, message: "User updated successfully", user });
  } catch (error) {
    // console.log("Error updating user:", error);
    res.status(500).send({ success: false, message: "Internal server error" });
  }
});
router.put("/admin/update-user", [auth, admin], async (req, res) => {
  try {
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
    } = req.body;
    let hashedPassword;
    console.log(password);
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
      console.log("Hashed Password:", hashedPassword);
    }
    console.log("Hashed Password:", hashedPassword);

    // Create an object to store the fields to be updated
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
    const user = await User.findByIdAndUpdate(req.user._id, updateFields, {
      new: true,
    });

    if (!user)
      return res.status(404).send({
        success: false,
        message: "The User with the given ID was not found.",
      });

    res.send({ success: true, message: "User updated successfully", user });
  } catch (error) {
    // console.log("Error updating user:", error);
    res.status(500).send({ success: false, message: "Internal server error" });
  }
});
router.put("/status", auth, async (req, res) => {
  const { status } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { status },
    { new: true }
  );

  if (!user)
    return res.status(404).send({
      success: false,
      message: "The User with the given ID was not found.",
    });

  res.send({ success: true, message: "User deleted successfully", user });
});
router.delete("/", auth, async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { status: "deleted" },
    { new: true }
  );

  if (!user)
    return res.status(404).send({
      success: false,
      message: "The User with the given ID was not found.",
    });

  res.send({ success: true, message: "User deleted successfully", user });
});

router.put("/premium", auth, async (req, res) => {
  const { premium } = req.body;

  if (typeof premium !== "boolean") {
    return res.status(400).send({
      success: false,
      message: "Premium status must be a boolean value.",
    });
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { premium },
    { new: true }
  );

  if (!user)
    return res.status(404).send({
      success: false,
      message: "The User with the given ID was not found.",
    });

  res.send({ success: true, message: "User premium status updated", user });
});
router.get("/activity-history", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      action,
      isDeleted,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    // Validate pagination parameters
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    if (
      isNaN(pageNumber) ||
      pageNumber < 1 ||
      isNaN(limitNumber) ||
      limitNumber < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid pagination parameters",
      });
    }

    // Build the query filter
    const filter = { userId: new mongooes.Types.ObjectId(userId) };

    if (action) filter.action = action;
    if (isDeleted !== undefined) filter.isDeleted = isDeleted === "true";

    // Date range filtering
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Get total count for pagination metadata
    const total = await History.countDocuments(filter);

    // Execute query with pagination
    const history = await History.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .lean();

    if (!history.length) {
      return res.status(404).json({
        success: false,
        message: "No matching activity history found.",
        data: [],
        total: 0,
        page: pageNumber,
        totalPages: 0,
      });
    }

    return res.json({
      success: true,
      data: history,
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / limitNumber),
    });
  } catch (error) {
    console.error("Error fetching activity history:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.post("/activity-history", auth, async (req, res) => {
  try {
    const { action, description } = req.body;
    const userId = req.user._id;

    // Basic validation
    if (!action || !description) {
      return res.status(400).json({
        success: false,
        message: "Action and description are required",
      });
    }

    const newActivity = await History.create({
      userId,
      action,
      description,
      isDeleted: false,
      createdAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      data: newActivity,
    });
  } catch (error) {
    console.error("Error creating activity history:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.delete("/activity-history/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { isDeleted } = req.body;
    const userId = req.user._id;
    // updateFields.updatedAt = new Date();
    const updateFields = { isDeleted, updatedAt: new Date() };
    const activity = await History.findOneAndUpdate(
      { _id: id, userId },
      updateFields,
      { new: true }
    );
    if (!activity) {
      return res.status(404).json({
        success: false,
        message:
          "Activity history not found or you do not have permission to delete it.",
      });
    }
    return res.json({
      success: true,
      message: "Activity history updated successfully",
      data: activity,
    });
  } catch (error) {
    console.error("Error updating activity history:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});
router.post("/purcahed", auth, async (req, res) => {
  const user = await User.findById(req.user._id).populate("PurchedPackages");
  const { name, paymentId, timePeriod, price } = req.body;
  try {
    const newPackage = new Package({
      name,
      paymentId,
      timePeriod,
      price,
    });
    await newPackage.save();
    user.PurchedPackages.push(newPackage._id);
    user.premium = true; // Set user as premium
    user.temp = true;
    await user.save();
    res.status(201).json({
      success: true,
      message: "Package created and added to user successfully",
      // package: newPackage,
      user,
    });
  } catch (error) {
    console.error("Error creating package:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
