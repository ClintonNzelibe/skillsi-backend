import { Request, Response } from "express";
import User from "../models/User.js";
import { StatusCodes } from "http-status-codes";
import { UploadFileToCloudinary } from "../helpers/index.js";

const changeProfilePicture = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = req.user?.userId;
    const { profilePicture } = req.body;

    if (!profilePicture) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Profile picture is required." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "User not found." });
    }

    // Upload the profile picture to Cloudinary
    const uploaded = await UploadFileToCloudinary(
      profilePicture,
      {
        folder: "ProfilePictures",
        allowedFileTypes: ["image/png", "image/jpeg", "image/gif"],
        maxSizeInMB: 10,
      },
      res
    );

    user.profilePicture = uploaded.secure_url;
    await user.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Profile picture updated successfully.",
    });
  } catch (error) {
    console.error("Error changing profile picture:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// Change Password
const changePassword = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId;
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "All fields are required." });
    }

    if (newPassword !== confirmPassword) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "New passwords do not match." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "User not found." });
    }

    const isPasswordCorrect = await user.comparePassword(oldPassword);
    if (!isPasswordCorrect) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Old password is incorrect." });
    }

    user.password = newPassword;
    await user.save();

    res
      .status(StatusCodes.OK)
      .json({ success: true, message: "Password changed successfully." });
  } catch (error) {
    console.error("Error changing password:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const closeAccount = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "User not found." });
    }

    user.accountClosed = true;
    await user.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Account closed and user deleted successfully.",
    });
  } catch (error) {
    console.error("Error closing account:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const updateNotificationPreferences = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { preferences } = req.body;

    const userId = req.user?.userId;

    if (!userId || !preferences) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Missing required fields" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "User not found" });
    }

    // Initialize preferences if undefined
    if (!user.notificationPreferences) {
      user.notificationPreferences = {
        inApp: false,
        email: false,
      };
    }

    // Update notification preferences
    if (preferences.inApp !== undefined) {
      user.notificationPreferences.inApp = preferences.inApp;
    }

    if (preferences.email !== undefined) {
      user.notificationPreferences.email = preferences.email;
    }

    await user.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Notification preferences updated successfully",
      preferences: user.notificationPreferences,
    });
  } catch (error) {
    console.error("Error updating notification preferences: ", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const toggleReminder = async (req: Request, res: Response) => {
  try {
    const { learningReminder } = req.body;
    const userId = req.user?.userId;

    if (userId === undefined || learningReminder === undefined) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Missing required fields" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "User not found" });
    }

    if (typeof learningReminder === "boolean") {
      user.learningReminder = learningReminder;
    }

    await user.save();

    res.status(StatusCodes.OK).json({
      message: `Learning Reminder ${
        learningReminder ? "activated" : "deactivated"
      } successfully`,
    });
  } catch (error) {
    console.error("Error toggling reminder:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const currentUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const user = await User.findOne({ _id: req.user?.userId });

    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "User doesn't exist" });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Fetched Succesfully",
      user: {
        userId: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePicture: user.profilePicture,
        learningReminder: user.learningReminder,
        notificationPreferences: user.notificationPreferences,
      },
    });
  } catch (error) {
    console.error("Error getting current user", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export {
  changeProfilePicture,
  changePassword,
  closeAccount,
  updateNotificationPreferences,
  toggleReminder,
  currentUser,
};
