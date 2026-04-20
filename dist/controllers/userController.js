import { StatusCodes } from "http-status-codes";
import User from "../models/User.js";
import PurchasedCourse from "../models/PurchasedCourse.js";
import PaymentHistory from "../models/PaymentHistory.js";
import { UploadFileToCloudinary, PasswordValidation, TokenGenerator, } from "../helpers/index.js";
import { createHash, sendResetPasswordEmail } from "../utils/index.js";
const changeProfilePicture = async (req, res) => {
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
        const uploaded = await UploadFileToCloudinary(profilePicture, {
            folder: "ProfilePictures",
            allowedFileTypes: ["image/png", "image/jpeg", "image/gif"],
            maxSizeInMB: 10,
        }, res);
        user.profilePicture = uploaded.secure_url;
        await user.save();
        res.status(StatusCodes.OK).json({
            success: true,
            message: "Profile picture updated successfully.",
        });
    }
    catch (error) {
        console.error("Error changing profile picture:", error);
        res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ success: false, message: "Internal Server Error" });
    }
};
// Change Password
const changePassword = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { oldPassword, newPassword, confirmPassword } = req.body;
        if (!oldPassword || !newPassword || !confirmPassword) {
            return res
                .status(StatusCodes.BAD_REQUEST)
                .json({ success: false, message: "All fields are required." });
        }
        // Validate password criteria
        const passwordError = PasswordValidation(newPassword);
        if (passwordError) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: passwordError,
            });
        }
        if (newPassword !== confirmPassword) {
            return res
                .status(StatusCodes.BAD_REQUEST)
                .json({ success: false, message: "New passwords do not match." });
        }
        const user = await User.findById(userId).select("+password");
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
    }
    catch (error) {
        console.error("Error changing password:", error);
        res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ success: false, message: "Internal Server Error" });
    }
};
const closeAccount = async (req, res) => {
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
    }
    catch (error) {
        console.error("Error closing account:", error);
        res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ success: false, message: "Internal Server Error" });
    }
};
const updateNotificationPreferences = async (req, res) => {
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
    }
    catch (error) {
        console.error("Error updating notification preferences: ", error);
        res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ success: false, message: "Internal Server Error" });
    }
};
const toggleReminder = async (req, res) => {
    try {
        const { learningReminder } = req.body;
        const userId = req.user?.userId;
        if (userId === undefined || learningReminder === undefined) {
            return res
                .status(StatusCodes.BAD_REQUEST)
                .json({ success: false, message: "Missing required fields" });
        }
        if (typeof learningReminder !== "boolean") {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Invalid value for learningReminder",
            });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res
                .status(StatusCodes.NOT_FOUND)
                .json({ success: false, message: "User not found" });
        }
        // if (typeof learningReminder === "boolean") {
        //   user.learningReminder = learningReminder;
        // }
        user.learningReminder = learningReminder;
        await user.save();
        res.status(StatusCodes.OK).json({
            success: true,
            message: `Learning Reminder ${learningReminder ? "activated" : "deactivated"} successfully`,
        });
    }
    catch (error) {
        console.error("Error toggling reminder:", error);
        res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ success: false, message: "Internal Server Error" });
    }
};
const currentUser = async (req, res) => {
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
    }
    catch (error) {
        console.error("Error getting current user", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
// forgotPassword
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res
                .status(StatusCodes.BAD_REQUEST)
                .json({ success: false, message: "Please provide valid email" });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res
                .status(StatusCodes.NOT_FOUND)
                .json({ success: false, message: "Email doesn't exist" });
        }
        // Generate verification token only for company registration
        const tokenData = await TokenGenerator();
        const finalVerificationToken = tokenData.finalVerificationToken;
        const verificationToken = tokenData.verificationToken;
        const verificationTokenExpirationDate = tokenData.verificationTokenExpirationDate;
        await sendResetPasswordEmail({
            fName: user.fullName && user.fullName.length > 0 ? user.fullName : "User",
            email: user.email,
            verificationToken,
        });
        user.resetToken = finalVerificationToken;
        user.resetTokenExpirationDate = verificationTokenExpirationDate;
        await user.save();
        res.status(StatusCodes.OK).json({
            success: true,
            message: "Please check your email for OTP",
            email: user.email,
        });
    }
    catch (error) {
        console.error("Error resetting password:", error);
        res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ success: false, message: "Internal Server Error" });
    }
};
// verifyEmailResetPassword
const verifyTokenResetPassword = async (req, res) => {
    try {
        const { verificationToken, email } = req.body;
        if (!verificationToken || !email) {
            return res
                .status(StatusCodes.BAD_REQUEST)
                .json({ success: false, message: "Please provide all values" });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res
                .status(StatusCodes.NOT_FOUND)
                .json({ success: false, message: "Email doesn't exist" });
        }
        const currentDate = new Date();
        if (user.resetToken === createHash(verificationToken) &&
            user.resetTokenExpirationDate > currentDate) {
            user.isResetTokenVerified = true;
            user.resetToken = "";
            user.resetTokenExpirationDate = new Date();
            await user.save();
            res
                .status(StatusCodes.OK)
                .json({ success: true, message: "OTP verification successful" });
        }
        else {
            res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "OTP invalid or OTP already expired",
            });
        }
    }
    catch (error) {
        console.error("Error Verifying password:", error);
        res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ success: false, message: "Internal Server Error" });
    }
};
// changePassword
const resetPassword = async (req, res) => {
    try {
        const { email, newPassword, confirmPassword } = req.body;
        if (!email || !newPassword || !confirmPassword) {
            return res
                .status(StatusCodes.BAD_REQUEST)
                .json({ success: false, message: "Please provide all values" });
        }
        // Validate password criteria
        const passwordError = PasswordValidation(newPassword);
        if (passwordError) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: passwordError,
            });
        }
        if (newPassword !== confirmPassword) {
            return res
                .status(StatusCodes.BAD_REQUEST)
                .json({ success: false, message: "Password doesn't match" });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res
                .status(StatusCodes.NOT_FOUND)
                .json({ success: false, message: "Email doesn't exist" });
        }
        if (!user.isResetTokenVerified) {
            return res
                .status(StatusCodes.UNAUTHORIZED)
                .json({ success: false, message: "Please verify your email" });
        }
        user.password = newPassword;
        user.isResetTokenVerified = true;
        await user.save();
        res
            .status(StatusCodes.OK)
            .json({ success: true, message: "Password changed successful" });
    }
    catch (error) {
        console.error("Error changing password:", error);
        res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ success: false, message: "Internal Server Error" });
    }
};
const resendToken = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res
                .status(StatusCodes.BAD_REQUEST)
                .json({ success: false, message: "Please provide valid email" });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res
                .status(StatusCodes.NOT_FOUND)
                .json({ success: false, message: "Email doesn't exist" });
        }
        // Generate verification token only for company registration
        const tokenData = await TokenGenerator();
        const finalVerificationToken = tokenData.finalVerificationToken;
        const verificationToken = tokenData.verificationToken;
        const verificationTokenExpirationDate = tokenData.verificationTokenExpirationDate;
        await sendResetPasswordEmail({
            fName: user.fullName && user.fullName.length > 0 ? user.fullName : "User",
            email,
            verificationToken,
        });
        user.resetToken = finalVerificationToken;
        user.resetTokenExpirationDate = verificationTokenExpirationDate;
        await user.save();
        res.status(StatusCodes.OK).json({
            success: true,
            message: "OTP sent, please kindly check your email",
        });
    }
    catch (error) {
        console.error("Error resending token:", error);
        res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ success: false, message: "Internal Server Error" });
    }
};
const fetchAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 50;
        const skip = (page - 1) * limit;
        const { search, status = "approved" } = req.query;
        let filter = {};
        const andFilters = [];
        if (search) {
            andFilters.push({
                $or: [
                    { fullName: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } },
                ],
            });
        }
        if (status && typeof status === "string") {
            andFilters.push({ status });
        }
        if (andFilters.length > 0) {
            filter.$and = andFilters;
        }
        const users = await User.find(filter)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .select("fullName email profilePicture totalPurchasedCourses");
        if (!users || users.length === 0) {
            return res.status(StatusCodes.OK).json({
                success: false,
                message: "No users found",
                users: [],
            });
        }
        const totalUsersCount = await User.countDocuments(filter);
        const totalPages = Math.ceil(totalUsersCount / limit);
        res.status(StatusCodes.OK).json({
            success: true,
            message: "Users fetched successfully",
            users,
            page,
            totalUserPerPage: users.length,
            totalPages,
            totalUsers: totalUsersCount,
        });
    }
    catch (error) {
        console.error("Error fetching all users:", error);
        res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ success: false, message: "Internal Server Error" });
    }
};
const fetchSingleUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = 50;
        const skip = (page - 1) * limit;
        const { tab = "purchasedCourses" } = req.query;
        if (!userId) {
            return res
                .status(StatusCodes.BAD_REQUEST)
                .json({ success: false, message: "User ID is required" });
        }
        const user = await User.findById(userId)
            .select("fullName email profilePicture status createdAt totalPurchasedCourses")
            .lean();
        if (!user) {
            return res
                .status(StatusCodes.NOT_FOUND)
                .json({ success: false, message: "User not found" });
        }
        let data = [];
        let totalCounts = 0;
        let totalPages = 0;
        let totalCountPerPage = 0;
        if (tab === "purchasedCourses") {
            totalCounts = await PurchasedCourse.countDocuments({
                customer: userId,
            });
            totalPages = Math.ceil(totalCounts / limit);
            data = await PurchasedCourse.find({ customer: userId })
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
                .select("customer course overallCompletionPercent")
                .populate({
                path: "course",
                select: "title subTitle description bannerImage numberOfModules numberOfLessons rating totalDuration",
            })
                .lean();
            totalCountPerPage = data.length;
        }
        else if (tab === "paymentHistory") {
            totalCounts = await PaymentHistory.countDocuments({
                customer: userId,
                customerModel: "User",
            });
            totalPages = Math.ceil(totalCounts / limit);
            data = await PaymentHistory.find({
                customer: userId,
                customerModel: "User",
            })
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
                .select("paidAt amount status transactionType reference transactionId cardType bank")
                .lean();
            totalCountPerPage = data.length;
        }
        res.status(StatusCodes.OK).json({
            success: true,
            message: "User fetched successfully",
            user,
            data,
            page,
            totalCountPerPage,
            totalPages,
            totalCounts,
        });
    }
    catch (error) {
        console.error("Error fetching single user:", error);
        res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ success: false, message: "Internal Server Error" });
    }
};
export { changeProfilePicture, changePassword, closeAccount, updateNotificationPreferences, toggleReminder, currentUser, forgotPassword, verifyTokenResetPassword, resetPassword, resendToken, fetchAllUsers, fetchSingleUser, };
