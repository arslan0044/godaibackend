const express = require("express");
const error = require("../middleware/error");
const auth = require("../routes/auth");
const authMiddleware = require("../middleware/auth");
const adminAuthMiddleware = require("../middleware/admin");
const users = require("../routes/users");
const blogRoute = require("../routes/blogRoute");
const notificationRoute = require("../routes/notificationRoute");
const uploadImages = require("../routes/uploadImages");
const spotify = require("../routes/spotify");
const invite = require("../routes/referralRoutes");
const points = require("../routes/PointsTreansactionRoute");
const admin = require("../routes/adminRoute");
const pageRoutes = require("../routes/pagesRoute");
const { Faq } = require("../models/Faq");
const { getPurchasedTokens } = require("../controllers/PurchasedTokenController");
module.exports = function (app) {
  app.use(express.json());
  app.get("/api/admin/faq", async (req, res) => {
    const faq = await Faq.find({}).lean();
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: "No FAQs found",
      });
    }
    res.json({
      success: true,
      faq: faq,
    });
  });
  app.get("/api/admin/purchased-coin", getPurchasedTokens);
  app.use("/api/auth", auth);
  app.use("/api/users", users);
  app.use("/api/reminder", authMiddleware, blogRoute);
  app.use("/api/image", uploadImages);
  app.use("/api/spotify", spotify);
  app.use("/api/invite", invite);
  app.use("/api/points", points);
  app.use("/api/admin", [authMiddleware, adminAuthMiddleware], admin);
  app.use("/api/pages", pageRoutes);
  app.use("/api/notification", authMiddleware, notificationRoute);

  app.use(error);
};
