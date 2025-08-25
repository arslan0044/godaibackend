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
    const { email, name, fcmtoken } = req.body;
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
