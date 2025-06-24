const PurchasedToken = require("../models/PurchasedToken");

exports.createPurchasedToken = async (req, res) => {
  try {
    const { amount, coins } = req.body;

    // Validate input
    if (typeof amount !== "number" || amount < 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a non-negative number.",
      });
    }

    if (typeof coins !== "number" || coins < 0) {
      return res.status(400).json({
        success: false,
        message: "Tokkens must be a non-negative number.",
      });
    }

    // Create new PurchasedToken
    const purchasedToken = new PurchasedToken({ amount, tokkens: coins });
    await purchasedToken.save();

    return res.status(201).json({
      success: true,
      message: "Purchased token created successfully.",
      data: purchasedToken,
    });
  } catch (error) {
    console.error("Error creating purchased token:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};
exports.getPurchasedTokens = async (req, res) => {
  try {
    const purchasedTokens = await PurchasedToken.find();

    return res.status(200).json({
      success: true,
      data: purchasedTokens,
    });
  } catch (error) {
    console.error("Error fetching purchased tokens:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};
exports.updatePurchasedToken = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, coins } = req.body;

    // Validate input
    if (typeof amount !== "number" || amount < 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a non-negative number.",
      });
    }

    if (typeof coins !== "number" || coins < 0) {
      return res.status(400).json({
        success: false,
        message: "Tokkens must be a non-negative number.",
      });
    }

    // Update PurchasedToken
    const updatedToken = await PurchasedToken.findByIdAndUpdate(
      id,
      { amount, tokkens: coins },
      { new: true }
    );

    if (!updatedToken) {
      return res.status(404).json({
        success: false,
        message: "Purchased token not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Purchased token updated successfully.",
      data: updatedToken,
    });
  } catch (error) {
    console.error("Error updating purchased token:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

exports.deletePurchasedToken = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete PurchasedToken
    const deletedToken = await PurchasedToken.findByIdAndDelete(id);

    if (!deletedToken) {
      return res.status(404).json({
        success: false,
        message: "Purchased token not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Purchased token deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting purchased token:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};
