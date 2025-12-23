import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import Admin from "../models/Admin.js";

import { PasswordValidation } from "../helpers/index.js";

const currentAffiliate = async (req: Request, res: Response): Promise<any> => {
  try {
    const admin = await Admin.findOne({
      _id: req.admin?.adminId,
    });

    if (!admin) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Admin doesn't exist" });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Admin Data Fetched Succesfully",
      affiliate: {
        affiliateId: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        profilePicture: admin.profilePicture,
        phoneNumber: admin.phoneNumber,
      },
    });
  } catch (error) {
    console.error("Error getting current admin", error);

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal Server Error",
    });
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

    const email = req.admin?.email;

    const admin = await Admin.findOne({ email }).select("+password");
    if (!admin) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Affiliate not found with this email",
      });
    }

    const isPasswordCorrect = await admin.comparePassword(password);
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

    admin.password = newPassword;
    await admin.save();

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

export { currentAffiliate };
