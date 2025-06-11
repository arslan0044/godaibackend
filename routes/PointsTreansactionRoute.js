const express = require("express");
const router = express.Router();
const pointsTransaction = require("../controllers/pointsTransactionController");
const auth = require("../middleware/auth");

router.post("/transfer-points", auth, pointsTransaction.transferPoints)

// exports = router;
module.exports = router;
