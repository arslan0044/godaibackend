const express = require("express");
const router = express.Router();
const {
  createPage,
  getPages,
  getPage,
  updatePage,
  deletePage,
} = require("../controllers/pagesController");
const admin = require("../middleware/admin");
const auth = require("../middleware/auth");

// Public routes
router.route("/").get(getPages);
router.route("/:type").get(getPage);
// Admin protected routes
router.use([auth, admin]);
router.route("/").post(createPage);
router.route("/:id").put(updatePage).delete(deletePage);
module.exports = router;
