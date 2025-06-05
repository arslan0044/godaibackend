const Notification = require("../models/Notification");
const admin = require("firebase-admin");

exports.sendNotification = async (userId,fcmtoken,title,body) => {
  try {
    const notification = new Notification({
      user:userId,
      description:body,
      title,
    });

    await notification.save();
    if (fcmtoken) {
      const message = {
        token: fcmtoken, // replace with the user's device token
        notification: {
          title: title,
          body: body,
        },
        android: {
          notification: {
            sound: "default",
          },
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
            },
          },
        },
      };

     await admin.messaging().send(message)
    }
  } catch (error) {
     console.log(error)
  }
};
