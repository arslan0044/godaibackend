const express = require("express");
const router = express.Router();
const pointsTransaction = require("../controllers/pointsTransactionController");
const auth = require("../middleware/auth");

router.post("/transfer-points", auth, pointsTransaction.transferPoints);
/**
 * @route POST /api/points/community-join
 * @description Allows users to join platform communities and earn reward points
 * @access Authenticated users only
 * @param {string} communityType - Required. Social platform name (facebook, instagram, twitter, etc.)
 * @param {string} profileUrl - Required. Public URL proving community membership/participation
 * @returns {Object} Response with points earned and join status
 * @returns {boolean} success - Request success status
 * @returns {string} message - Success/error message
 * @returns {number} pointsEarned - Points awarded for joining
 * @returns {number} totalPoints - User's updated total points
 * @throws {400} If required fields are missing or invalid community type
 * @throws {400} If user already joined this community
 * @throws {404} If points configuration not found for community
 * @throws {403} If unauthorized access attempted
 * @throws {500} If server error occurs
 * 
 * @example
 * // Successful request
 * POST /api/community-join
 * Headers: { "Authorization": "Bearer <user-token>" }
 * Body: {
 *   "communityType": "facebook",
 *   "profileUrl": "https://facebook.com/johndoe/profile"
 * }
 * 
 * @example
 * // Response
 * {
 *   "success": true,
 *   "message": "Successfully joined facebook community",
 *   "pointsEarned": 100,
 *   "totalPoints": 1100
 * }
 */
router.post("/community-join", auth, pointsTransaction.joinCommunity);
// router.post("/community-join", auth, pointsTransaction.joinCommunity);

// exports = router;
module.exports = router;
