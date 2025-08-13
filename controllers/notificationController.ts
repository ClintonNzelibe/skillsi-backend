import { Request, Response } from "express";
import Notification from "../models/Notification.js"; // Adjust path
import { StatusCodes } from "http-status-codes";

// utils/shortenMessage.ts
const shortenNotificationMessage = (
  notifications: any[],
  length: number = 30
) => {
  return notifications.map((notification) => ({
    ...notification.toObject(),
    message:
      notification.message.length > length
        ? notification.message.substring(0, length) + "..."
        : notification.message,
  }));
};

// CREATE NOTIFICATION
const createNotification = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { title, message, recipient, type } = req.body;

    if (!title || !message || !recipient) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Title, message, and recipient are required",
      });
    }

    const notification = await Notification.create({
      title,
      message,
      recipient,
      type,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Notification created successfully",
      notification,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// FETCH NOTIFICATIONS
const fetchNotifications = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = req.user?.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.page as string) || 50;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({
      user: userId,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await Notification.countDocuments({
      user: userId,
    });
    const totalPages = Math.ceil(totalCount / limit);

    // Shorten messages before sending
    const shortenedNotifications = shortenNotificationMessage(
      notifications,
      30
    );

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Notifications fetched successfully",
      notifications: shortenedNotifications,
      page,
      totalNotificationsPerPage: notifications.length,
      totalPages,
      totalNotifications: totalCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// GET SINGLE NOTIFICATION DETAILS
const getSingleNotification = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { notificationId } = req.params;
    const userId = req.user?.userId;

    const notification = await Notification.findOne({
      _id: notificationId,
      user: userId,
    });

    if (!notification) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Notification not found" });
    }

    // If unread, mark as read
    if (notification.status === "unread") {
      notification.status = "read";
      await notification.save();
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Notification details fetched successfully",
      notification,
    });
  } catch (error) {
    console.error("Error fetching notification details:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// MARK SINGLE NOTIFICATION AS READ
const markAsRead = async (req: Request, res: Response): Promise<any> => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { status: "read" },
      { new: true }
    );

    if (!notification) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Notification not found" });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// MARK ALL NOTIFICATIONS AS READ
const markAllAsRead = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId;
    await Notification.updateMany(
      { user: userId, status: "unread" },
      { $set: { status: "read" } }
    );

    res.status(StatusCodes.OK).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export {
  createNotification,
  fetchNotifications,
  getSingleNotification,
  markAsRead,
  markAllAsRead,
};
