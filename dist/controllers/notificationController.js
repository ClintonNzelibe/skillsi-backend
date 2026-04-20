import Notification from "../models/Notification.js"; // Adjust path
import { StatusCodes } from "http-status-codes";
import { 
//   shortenNotificationMessage,
generateNotificationPreview, } from "../constants/index.js";
// CREATE NOTIFICATION
const createNotification = async (req, res) => {
    try {
        const { title, messageHtml, isHtml, ctaUrl, meta, user, type } = req.body;
        if (!title ||
            !messageHtml ||
            typeof isHtml !== "boolean" ||
            !type ||
            !user) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "All fields are required",
            });
        }
        const messageText = generateNotificationPreview(messageHtml, 30);
        const notification = await Notification.create({
            title,
            messageText,
            messageHtml,
            isHtml,
            ctaUrl,
            meta,
            user,
            type,
        });
        res.status(StatusCodes.CREATED).json({
            success: true,
            message: "Notification created successfully",
            notification,
        });
    }
    catch (error) {
        console.error("Error creating notification:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
// FETCH NOTIFICATIONS
const fetchAllNotifications = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const notifications = await Notification.find({
            user: userId,
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit).select("title messageText isHtml status type user createdAt");
        const totalCount = await Notification.countDocuments({
            user: userId,
        });
        const totalPages = Math.ceil(totalCount / limit);
        // Shorten messages before sending
        // const shortenedNotifications = shortenNotificationMessage(
        //   notifications,
        //   30
        // );
        res.status(StatusCodes.OK).json({
            success: true,
            message: "Notifications fetched successfully",
            notifications,
            page,
            totalNotificationsPerPage: notifications.length,
            totalPages,
            totalNotifications: totalCount,
        });
    }
    catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
// GET SINGLE NOTIFICATION DETAILS
const getSingleNotification = async (req, res) => {
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
    }
    catch (error) {
        console.error("Error fetching notification details:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
// MARK SINGLE NOTIFICATION AS READ
const markANotificationAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const notification = await Notification.findByIdAndUpdate(notificationId, { status: "read" }, { new: true });
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
    }
    catch (error) {
        console.error("Error marking notification as read:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
// MARK ALL NOTIFICATIONS AS READ
const markAllNotificationsAsRead = async (req, res) => {
    try {
        const userId = req.user?.userId;
        await Notification.updateMany({ user: userId, status: "unread" }, { $set: { status: "read" } });
        res.status(StatusCodes.OK).json({
            success: true,
            message: "All notifications marked as read",
        });
    }
    catch (error) {
        console.error("Error marking all notifications as read:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
export { createNotification, fetchAllNotifications, getSingleNotification, markANotificationAsRead, markAllNotificationsAsRead, };
