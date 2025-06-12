const express = require("express");
const router = express.Router();
const pointsTransaction = require("../controllers/pointsTransactionController");
const auth = require("../middleware/auth");

router.post("/transfer-points", auth, pointsTransaction.transferPoints);

router.post("/community-join", auth, pointsTransaction.joinCommunity);

// exports = router;
module.exports = router;
