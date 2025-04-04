import { Request, Response } from "express";
import User from "../models/User.js";
import { StatusCodes } from "http-status-codes";
import { PasswordValidation } from "../helpers/index.js";
import { createTokenUser, createUserJWT } from "../utils/index.js";
import { TokenUser } from "../type.js";

const register = async (req: Request, res: Response): Promise<any> => {
  try {
    const { fullName, email, password, authProvider } = req.body;

    // Validate input
    if (!fullName || !email || !authProvider) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "All fields are required." });
    }

    if (authProvider === "manual") {
      if (!password) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Password is required for manual registration.",
        });
      }

      // Validate password criteria
      const passwordError = PasswordValidation(password);
      if (passwordError) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: passwordError,
        });
      }
    }

    // Create user object
    await User.create({
      fullName,
      email,
      password,
    });

    res
      .status(StatusCodes.CREATED)
      .json({ success: true, message: "Registered successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Server error" });
  }
};

const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password, authProvider } = req.body;

    if (!email || !authProvider) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "Email and authProvider are required." });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: "Invalid Credentials" });
    }

    // Handle manual authentication
    if (authProvider === "manual") {
      if (!password) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          msg: "Password is required for manual login.",
        });
      }

      const isPasswordCorrect = await user.comparePassword(password);

      if (!isPasswordCorrect) {
        return res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ success: false, msg: "Invalid Credentials" });
      }

      const loggedInTimes = user.loggedInTimes || 0;

      user.loggedInTimes = loggedInTimes + 1;
      user.lastLoggedIn = new Date();
      await user.save();

      // Ensure required fields are not undefined
      if (!user._id || !user.email || user.fullName == null) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ success: false, msg: "Incomplete admin data" });
      }

      const tokenCompany: TokenUser = createTokenUser({
        userId: user?._id?.toString() || "",
        email: user?.email || "",
        fullName: user?.fullName || "",
      });

      const token = createUserJWT(tokenCompany);

      return res.status(StatusCodes.OK).json({
        success: true,
        msg: "Login successfully!",
        token,
      });
    }

    res
      .status(StatusCodes.OK)
      .json({ success: true, message: "Login successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Server error" });
  }
};

export { register, login };
