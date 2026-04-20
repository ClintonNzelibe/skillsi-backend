import admin from "../utils/firebase.js";
const SendInAppNotification = async (deviceToken, notification) => {
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
    }
    catch (error) {
        console.error("Error sending notification:", error);
        return false;
    }
};
const StoreInAppNotification = async (userId, message) => {
    console.log(`Storing in-app notification for user ${userId}: ${message}`);
    // Implement DB save here if needed
    return true;
};
export { SendInAppNotification, StoreInAppNotification };
