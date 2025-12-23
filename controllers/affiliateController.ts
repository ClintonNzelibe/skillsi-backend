import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import Affiliate from "../models/Affiliate.js";
import PaymentHistory from "../models/PaymentHistory.js";
import ShortLink from "../models/ShortLink.js";

import {
  DeleteFileFromCloudinary,
  PasswordValidation,
  TokenGenerator,
  UploadFileToCloudinary,
} from "../helpers/index.js";
import { createHash, sendResetPasswordEmail } from "../utils/index.js";

const updateAffiliateProfile = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { firstName, lastName, profilePicture, phoneNumber } = req.body;

    const affiliateId = req.affiliate?.affiliateId;

    if (!affiliateId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Unauthorized Tutor",
      });
    }

    const affiliate = await Affiliate.findById(affiliateId);
    if (!affiliate) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Tutor not found with this email",
      });
    }

    // Upload new profile picture if provided and different from existing
    if (profilePicture && profilePicture.startsWith("data:")) {
      // Delete existing image if it exists
      if (affiliate.profilePicture) {
        await DeleteFileFromCloudinary(affiliate.profilePicture);
      }

      const uploadResult = await UploadFileToCloudinary(
        profilePicture,
        {
          folder: "Tutors/ProfilePictures",
          allowedFileTypes: ["image/png", "image/jpg", "image/jpeg"],
          maxSizeInMB: 5,
        },
        res
      );

      affiliate.profilePicture = uploadResult?.secure_url;
    }

    // Fields allowed to be updated
    if (firstName !== undefined) affiliate.firstName = firstName;
    if (lastName !== undefined) affiliate.lastName = lastName;

    if (phoneNumber !== undefined) affiliate.phoneNumber = phoneNumber;

    affiliate.isProfileComplete = !!(
      firstName &&
      lastName &&
      affiliate.profilePicture &&
      affiliate.phoneNumber
    );

    await affiliate.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Affiliate profile updated successfully",
      affiliate: {
        affiliateId: affiliate._id,
        firstName: affiliate.firstName,
        lastName: affiliate.lastName,
        email: affiliate.email,
        profilePicture: affiliate.profilePicture,
        phoneNumber: affiliate.phoneNumber,
        isProfileComplete: affiliate.isProfileComplete,
      },
    });
  } catch (error) {
    console.error("Error updating affiliate profile", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const currentAffiliate = async (req: Request, res: Response): Promise<any> => {
  try {
    const affiliate = await Affiliate.findOne({
      _id: req.affiliate?.affiliateId,
    });

    if (!affiliate) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Affiliate doesn't exist" });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Affiliate Data Fetched Succesfully",
      affiliate: {
        affiliateId: affiliate._id,
        firstName: affiliate.firstName,
        lastName: affiliate.lastName,
        email: affiliate.email,
        profilePicture: affiliate.profilePicture,
        phoneNumber: affiliate.phoneNumber,
        isProfileComplete: affiliate.isProfileComplete,
      },
    });
  } catch (error) {
    console.error("Error getting current affiliate", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// forgotPassword
const forgotPassword = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Please provide valid email" });
    }

    const affiliate = await Affiliate.findOne({ email });
    if (!affiliate) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Email doesn't exist" });
    }

    // Generate verification token only for company registration
    const {
      finalVerificationToken,
      verificationToken,
      verificationTokenExpirationDate,
    } = await TokenGenerator();

    await sendResetPasswordEmail({
      fName: affiliate.firstName,
      email: affiliate.email,
      verificationToken,
    });

    affiliate.resetToken = finalVerificationToken;
    affiliate.resetTokenExpirationDate = verificationTokenExpirationDate;
    await affiliate.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Please check your email for OTP",
      email: affiliate.email,
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// verifyEmailResetPassword
const verifyResetPasswordToken = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { verificationToken, email } = req.body;
    if (!verificationToken || !email) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Please provide all values" });
    }
    const affiliate = await Affiliate.findOne({ email });

    if (!affiliate) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Email doesn't exist" });
    }

    const currentDate = new Date();

    if (
      affiliate.resetToken === createHash(verificationToken) &&
      affiliate.resetTokenExpirationDate > currentDate
    ) {
      affiliate.isResetTokenVerified = true;
      affiliate.resetToken = "";
      affiliate.resetTokenExpirationDate = new Date();
      await affiliate.save();

      res
        .status(StatusCodes.OK)
        .json({ success: true, message: "OTP verification successful" });
    } else {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "OTP invalid" });
    }
  } catch (error) {
    console.error("Error Verifying OTP:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// changePassword
const resetPassword = async (req: Request, res: Response): Promise<any> => {
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

    const affiliate = await Affiliate.findOne({ email }).select("+password");
    if (!affiliate) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Affiliate not found with this email",
      });
    }

    if (!affiliate.isResetTokenVerified) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ success: false, message: "Please verify your email" });
    }

    affiliate.password = newPassword;
    affiliate.isResetTokenVerified = true;
    await affiliate.save();

    res
      .status(StatusCodes.OK)
      .json({ success: true, message: "Password changed successful" });
  } catch (error) {
    console.error("Error changing password:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const resendToken = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Please provide valid email" });
    }

    const affiliate = await Affiliate.findOne({ email });

    if (!affiliate) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Email doesn't exist" });
    }

    // Generate verification token only for company registration
    const {
      finalVerificationToken,
      verificationToken,
      verificationTokenExpirationDate,
    } = await TokenGenerator();

    await sendResetPasswordEmail({
      fName: affiliate.firstName,
      email,
      verificationToken,
    });

    affiliate.resetToken = finalVerificationToken;
    affiliate.resetTokenExpirationDate = verificationTokenExpirationDate;
    await affiliate.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: "OTP sent, please kindly check your email",
      email: affiliate.email,
    });
  } catch (error) {
    console.error("Error resending token:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// changePassword
const changePassword = async (req: Request, res: Response): Promise<any> => {
  try {
    const { password, newPassword, confirmPassword } = req.body;
    if (!password || !newPassword || !confirmPassword) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Please provide all values" });
    }

    const email = req.affiliate?.email;

    const affiliate = await Affiliate.findOne({ email }).select("+password");
    if (!affiliate) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Affiliate not found with this email",
      });
    }

    const isPasswordCorrect = await affiliate.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Invalid credentials",
      });
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

    affiliate.password = newPassword;
    await affiliate.save();

    res
      .status(StatusCodes.OK)
      .json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const dashboardData = async (req: Request, res: Response): Promise<any> => {
  try {
    const { dataType, year } = req.query;
    const affiliateId = req.affiliate?.affiliateId;
    const affiliate = await Affiliate.findById(affiliateId);

    if (!affiliate) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Affiliate doesn't exist",
      });
    }

    let data: any = {};
    if (dataType === "earnings") {
      data = {
        balance: affiliate.balance,
        totalRevenue: affiliate.totalRevenue,
        totalWithdrawals: affiliate.totalWithdrawals,
        pendingWithdrawals: affiliate.pendingWithdrawals,
      };
    } else if (dataType === "overview") {
      data = {
        balance: affiliate.balance,
        totalRevenue: affiliate.totalRevenue,
        totalCoursesSold: affiliate.totalCoursesSold,
        totalCoursesPromoted: affiliate.totalCoursesPromoted,
      };
    }

    let chart: any = null;
    // === Earnings Chart ===
    if (dataType === "overview") {
      const selectedYear = year
        ? parseInt(year as string, 10)
        : new Date().getFullYear();

      const payments = await PaymentHistory.aggregate([
        {
          $match: {
            customer: affiliate._id,
            customerModel: "Affiliate",
            type: "credit", // only money coming in
            createdAt: {
              $gte: new Date(`${selectedYear}-01-01T00:00:00.000Z`),
              $lte: new Date(`${selectedYear}-12-31T23:59:59.999Z`),
            },
          },
        },
        {
          $group: {
            _id: { $month: "$createdAt" },
            total: { $sum: "$amount" },
          },
        },
      ]);

      // Create 12 months (Jan - Dec) with 0 defaults
      const monthlyEarnings: { [key: string]: number } = {};
      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      months.forEach((m) => (monthlyEarnings[m] = 0));

      payments.forEach((p) => {
        //   const monthIndex = p._id - 1; // Mongo month starts at 1
        //   monthlyEarnings[months[monthIndex]] = p.total;
        // });
        const monthIndex = (p._id ?? 1) - 1; // Ensure _id is not undefined
        if (monthIndex >= 0 && monthIndex < months.length) {
          monthlyEarnings[months[monthIndex]!] = p.total;
        }
      });

      chart = { year: selectedYear, monthlyEarnings };
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Dashboard data fetched successfully",
      data: {
        ...data,
        ...(chart && { chart }), // only add chart if it exists
      },
    });
  } catch (error) {
    console.error("Error getting dashboard  data", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const fetchAllAffiliates = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
  } catch (error) {
    console.error("Error fetching all tutors:", error);

    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const fetchSingleAffiliate = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { affiliateId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 50;
    const skip = (page - 1) * limit;
    const { tab = "courses" } = req.query;

    if (!affiliateId) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Affiliate ID is required" });
    }

    const affiliate = await Affiliate.findById(affiliateId)
      .select(
        "fName lName email profilePicture phoneNumber status createdAt totalRevenue"
      )
      .lean();
    if (!affiliate) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "affiliate not found" });
    }

    let data: any[] = [];
    let totalCounts = 0;
    let totalPages = 0;
    let totalCountPerPage = 0;

    if (tab === "courses") {
      totalCounts = await ShortLink.countDocuments({
        customer: affiliateId,
        customerModel: "Affiliate",
      });
      totalPages = Math.ceil(totalCounts / limit);
    } else if (tab === "earnings") {
    } else if (tab === "reviews") {
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Tutor fetched successfully",
      affiliate,
      data,
      page,
      totalCountPerPage,
      totalPages,
      totalCounts,
    });
  } catch (error) {
    console.error("Error fetching single tutor:", error);

    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export {
  updateAffiliateProfile,
  currentAffiliate,
  forgotPassword,
  verifyResetPasswordToken,
  resetPassword,
  resendToken,
  changePassword,
  dashboardData,
  fetchAllAffiliates,
};
