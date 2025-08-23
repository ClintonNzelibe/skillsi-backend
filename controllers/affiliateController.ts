import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import Affiliate from "../models/Affiliate.js";
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
      message: "Fetched Succesfully",
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
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({
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

export {
  updateAffiliateProfile,
  currentAffiliate,
  forgotPassword,
  verifyResetPasswordToken,
  resetPassword,
  resendToken,
  changePassword,
};