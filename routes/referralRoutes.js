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

// Protected route - requires authentication
router.get("/generate-link", auth, generateReferralLink);
router.route("/admin-points").post(createActivityPoints).get(getActivityPoints);
router
  .route("/admin-points/:id")
  .get(getSingleActivityPoint)
  .put(updateActivityPoints)
  .delete(deleteActivityPoints);
// router.get("/points/summary", auth, getPointsSummary);
module.exports = router;
