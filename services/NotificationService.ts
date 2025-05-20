import admin from "../utils/firebase.js";

interface NotificationPayload {
  title: string;
  body: string;
}

const SendInAppNotification = async (
  deviceToken: string,
  notification: NotificationPayload
) => {
  try {
    if (!admin.apps.length) {
      console.error("Firebase admin not initialized");
      return false;
    }

    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      token: deviceToken,
    };

    const response = await admin.messaging().send(message);
    console.log("Successfully sent notification:", response);
    return true;
  } catch (error) {
    console.error("Error sending notification:", error);
    return false;
  }
};

const StoreInAppNotification = async (
  userId: string,
  message: string
) => {
  console.log(`Storing in-app notification for user ${userId}: ${message}`);

  // Implement DB save here if needed

  return true;
};

export { SendInAppNotification, StoreInAppNotification };
