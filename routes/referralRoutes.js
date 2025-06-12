// routes/referralRoutes.js
const express = require("express");
const router = express.Router();
const {
  generateReferralLink,
  createActivityPoints,
  getActivityPoints,
  getSingleActivityPoint,
  updateActivityPoints,
  deleteActivityPoints,
  // getPointsSummary,
} = require("../controllers/referralController");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

// Protected route - requires authentication
router.get("/generate-link", auth, generateReferralLink);
router.get("/admin-points", getActivityPoints);
router.post("/admin-points", [auth, admin], createActivityPoints);
router.get("/admin-points/:id", getSingleActivityPoint);
router.put("/admin-points/:id", [auth, admin], updateActivityPoints);
router.delete("/admin-points/:id", [auth, admin], deleteActivityPoints);

// router.get("/points/summary", auth, getPointsSummary);
module.exports = router;
