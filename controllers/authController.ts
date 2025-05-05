import { Request, Response } from "express";
import User from "../models/User.js";
import { StatusCodes } from "http-status-codes";
import { PasswordValidation } from "../helpers/index.js";
import { createTokenUser, createUserJWT } from "../utils/index.js";
import { TokenUser } from "../type.js";

const register = async (req: Request, res: Response): Promise<any> => {
  try {
    const { fullName, email, password, authProvider, deviceId } = req.body;

    // Validate input
    if (!fullName || !email || !authProvider || !deviceId) {
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
      currentDeviceId: deviceId,
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
    const { email, password, authProvider, deviceId } = req.body;

    if (!email || !authProvider || !deviceId) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Email and authProvider are required." });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Invalid Credentials" });
    }

    // Handle manual authentication
    if (authProvider === "manual") {
      if (!password) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Password is required for manual login.",
        });
      }

      const isPasswordCorrect = await user.comparePassword(password);

      if (!isPasswordCorrect) {
        return res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ success: false, message: "Invalid Credentials" });
      }

      // Restrict login if user is already logged in from a different device
      if (user.isLoggedIn && user.currentDeviceId !== deviceId) {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message:
            "You are already logged in on another device. Please logout first.",
        });
      }

      // If logging in from a new device
      const isNewDevice = user.currentDeviceId !== deviceId;

      // Update user session
      user.currentDeviceId = deviceId;
      user.isLoggedIn = true;

      // Add to registeredDeviceIds if not already present
      if (!user.registeredDeviceIds?.includes(deviceId)) {
        user.registeredDeviceIds?.push(deviceId);
      }

      user.loggedInTimes = (user.loggedInTimes || 0) + 1;
      user.lastLoggedIn = new Date();

      await user.save();

      // Allow login only if deviceId matches or first-time login
      if (isNewDevice) {
        // New device detected
        // await sendEmail({
        //   to: user.email,
        //   subject: "New Device Login Detected",
        //   text: `We noticed a login to your account from a new device. If this wasn't you, please reset your password.`,
        // });
      }

      // Ensure required fields are not undefined
      if (!user._id || !user.email || user.fullName == null) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ success: false, message: "Incomplete admin data" });
      }

      const tokenCompany: TokenUser = createTokenUser({
        userId: user?._id?.toString() || "",
        email: user?.email || "",
        fullName: user?.fullName || "",
      });

      const token = createUserJWT(tokenCompany);

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Login successfully!",
        token,
      });
    }

    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Unsupported auth provider",
    });
  } catch (error) {
    console.error("Error logging in", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const logout = async (req: Request, res: Response): Promise<any> => {
  try {
    const email = req.user?.email;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }

    user.isLoggedIn = false;
    user.currentDeviceId = undefined;

    await user.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Error logging out", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export { register, login, logout };
