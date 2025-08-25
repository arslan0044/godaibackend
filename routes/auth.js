const Joi = require("joi");
const bcrypt = require("bcryptjs");
const {
  User,
  generateAuthToken,
  admingenerateIdToken,
} = require("../models/user");
const express = require("express");
const router = express.Router();
// const { generateRandomString } = require("../controllers/generateCode");
const { generateReferralCode } = require("../utils/referralUtils");
const ActivityPoints = require("../models/activityPoints");
const PointsHistory = require("../models/pointsHistory");

function uid() {
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  var charactersLength = characters.length;
  for (var i = 0; i < 32; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

router.post("/admin", async (req, res) => {
  const { error } = validate(req.body);
  if (error)
    return res
      .status(400)
      .send({ success: false, message: error.details[0].message });

  const { email, password } = req.body;

  const user = await User.findOne({
    email,
    type: { $in: ["admin", "superadmin"] },
  });

  if (!user)
    return res
      .status(400)
      .send({ success: false, message: "Invalid credentials" });

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword)
    return res
      .status(400)
      .send({ success: false, message: "Invalid credentials" });

  if (user.status == "deleted")
    return res.status(400).send({
      success: false,
      message: "User has been deleted. Contact admin for further support.",
    });
  if (user.status == "deactivated")
    return res.status(400).send({
      success: false,
      message: "User has been deactivated. Contact admin for further support.",
    });

  const token = admingenerateIdToken(user._id, user.type);
  res.send({
    token: token,
    user: user,
  });
});

router.post("/:type?", async (req, res) => {
  if (req.params.type == "social-login") {
    const { email, name, fcmtoken, referralCode } = req.body;
    const updatEmail = String(email).trim().toLocaleLowerCase();

    const user = await User.findOne({ email: updatEmail });

    if (!user) {
      const newUser = new User({
        email: updatEmail,
        name: name,
        login_type: "social-login",
        fcmtoken,
      });
      newUser.referralCode = generateReferralCode(newUser._id);
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

      const token = generateAuthToken(newUser._id, newUser.type);

      res.send({
        success: true,
        message: "Account created successfully",
        token: token,
        user: newUser,
      });
      return;
    }

    if (user.status == "deleted" || user.status == "deactivated") {
      return res.status(400).send({
        success: false,
        message: `User has been ${user.status}. Contact admin for further support.`,
      });
    }
    await User.findByIdAndUpdate(user._id, { fcmtoken, verify: true });

    const token = generateAuthToken(user._id, user.type);
    res.send({
      token: token,
      user: user,
    });
    return;
  }

  const { error } = validate(req.body);
  if (error)
    return res
      .status(400)
      .send({ success: false, message: error.details[0].message });

  const { email, password, fcmtoken } = req.body;

  const updatEmail = String(email).trim().toLocaleLowerCase();

  const user = await User.findOne({ email: updatEmail });

  if (!user)
    return res
      .status(400)
      .send({ success: false, message: "Invalid credentials" });

  if (user.login_type == "social-login")
    return res
      .status(400)
      .send({ success: false, message: "Email is used through social login." });

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword)
    return res
      .status(400)
      .send({ success: false, message: "Invalid credentials" });

  if (user.status == "deactivated" || user.status == "deleted")
    return res.status(400).send({
      success: false,
      message: `User has been ${user.status}. Contact admin for further support.`,
    });
  if (user.verify == false) {
    return res.status(400).send({
      success: false,
      email: user.email,
      isVerified: user.verify,
      message: `User is not verified. Please verify your email to login.`,
    });
  }
  user.fcmtoken = fcmtoken;
  await user.save();

  const token = generateAuthToken(user._id, user.type);
  res.send({
    token: token,
    user: user,
  });
});

function validate(req) {
  const emailSchema = {
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(5).max(255).required(),
    fcmtoken: Joi.string().min(0).max(255).optional(),
  };

  const schema = Joi.object(emailSchema);

  return schema.validate(req);
}

module.exports = router;
