// controllers/notificationController.ts
import { Request, Response } from "express";
import NotificationToken from "../models/NotificationToken";
import { StatusCodes } from "http-status-codes";
import admin from "../utils/firebase.js";

// Initialize Firebase Admin (only once in your app startup)

// 1️⃣ Add or update notification token
const addNotificationToken = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { token, deviceType } = req.body;
    const userId = req.user?.userId; // assuming auth middleware

    if (!token) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Push notification token is required",
      });
    }

    const existingToken = await NotificationToken.findOne({ user: userId });

    if (existingToken) {
      existingToken.token = token;
      existingToken.deviceType = deviceType || existingToken.deviceType;
      await existingToken.save();
    } else {
      await NotificationToken.create({
        user: userId,
        token,
        deviceType,
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Notification token saved successfully",
    });
  } catch (error) {
    console.error("Error saving notification token:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// 2️⃣ Send push notification to user
const sendNotification = async (
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
) => {
  try {
    const tokenDoc = await NotificationToken.findOne({ user: userId });
    if (!tokenDoc) {
      throw new Error("No notification token found for this user");
    }

    const message = {
      token: tokenDoc.token,
      notification: {
        title,
        body,
      },
      data: data || {},
    };

    await admin.messaging().send(message);
    return { success: true };
  } catch (error: any) {
    console.error("Error sending push notification:", error);
    return { success: false, error: error?.message };
  }
};

// 3️⃣ Test endpoint to send notification
const testSendNotification = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "User ID is required" });
    }

    const result = await sendNotification(
      userId || "688a5f6a3e8a3af5f22c15af",
      "Test Notification",
      "This is a test push notification ✅",
      { testKey: "testValue" }
    );

    if (result.success) {
      res.status(StatusCodes.OK).json({
        success: true,
        message: "Test notification sent successfully",
      });
    } else {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: result.error || "Failed to send test notification",
      });
    }
  } catch (error) {
    console.error("Error in testSendNotification:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal server error" });
  }
};

export { addNotificationToken, testSendNotification };
