import { Request, Response } from "express";
import Admin from "../models/Admin.js";
import { StatusCodes } from "http-status-codes";
import { PasswordValidation } from "../helpers/index.js";
import { createAdminJWT, createTokenAdmin } from "../utils/index.js";
import { TokenAdmin } from "../type.js";

const signupAdmin = async (req: Request, res: Response): Promise<any> => {
  try {
    const { firstName, lastName, userName, email, password, confirmPassword } =
      req.body;
    // Validate input
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "All fields are required." });
    }

    // Check if admin exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Admin already exists" });
    }

    const existingUserName = await Admin.findOne({ userName });
    if (existingUserName) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "User name already exists" });
    }

    // Validate password criteria
    const passwordError = PasswordValidation(password);
    if (passwordError) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: passwordError,
      });
    }

    if (password !== confirmPassword) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Password and Confirm Password doesn't match.",
      });
    }

    // Determine role
    const totalAdmins = await Admin.countDocuments();
    const role = totalAdmins === 0 ? "superadmin" : "admin";

    // Create admin
    await Admin.create({
      firstName,
      lastName,
      userName,
      email,
      password,
      role,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Admin registered successfully",
    });
  } catch (error) {
    console.error("Error signingup admin", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const signinAdmin = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email }).select("+password");
    if (!admin) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isPasswordCorrect = await admin.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Ensure required fields are not undefined
    if (
      !admin._id ||
      !admin.firstName ||
      !admin.lastName ||
      !admin.userName ||
      !admin.email ||
      !admin.role
    ) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Incomplete admin data" });
    }

    const tokenTutor: TokenAdmin = createTokenAdmin({
      adminId: admin?._id?.toString() || "",
      firstName: admin?.firstName || "",
      lastName: admin?.lastName || "",
      userName: admin?.userName || "",
      email: admin?.email || "",
      role: admin?.role || "admin",
    });

    const token = createAdminJWT(tokenTutor);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Tutor Signedin successfully",
      token,
    });
  } catch (error) {
    console.error("Signin error", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export { signupAdmin, signinAdmin };
