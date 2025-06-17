const Notification = require("../models/Notification");

exports.getApplicationDetails = async (req, res) => {
  let query = {};
  if (req.params.id) {
    query._id = { $lt: req.params.id };
  }
  query.user = req.user._id;
  try {
    const notifications = await Notification.find(query)
      .sort({ _id: -1 })
      .limit(15)
      .lean();

    await Notification.updateMany(
      { user: req.user._id, seen: false },
      { $set: { seen: true } }
    );

    if (notifications.length > 0) {
      res.status(200).json({ success: true, notifications: notifications });
    } else {
      res
        .status(200)
        .json({
          success: false,
          notifications: [],
          message: "No more Notification found",
        });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.checkSeen = async (req, res) => {
  let query = {};
  query.user = req.user._id;
  query.seen = false;
  try {
    const notifications = await Notification.find(query).lean();

    res.status(200).json({ success: true, unseen: notifications.length });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteNoti = async (req, res) => {
  try {
    const notiId = req.params.id;
    const userId = req.user._id;

    const notification = await Notification.findOneAndDelete({
      user: userId,
      _id: notiId,
    });

    if (notification == null) {
      return res.status(404).json({ message: "Notifcation not found" });
    }

    res
      .status(200)
      .json({
        message: `Notifcation deleted successfully`,
        notification: notification,
      });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
