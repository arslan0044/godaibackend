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

module.exports = function (app) {
  app.use(express.json());
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

  app.post("/api/admin/faq", async (req, res) => {
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
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  });
  app.use(error);
};
