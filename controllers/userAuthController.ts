import { Request, Response } from "express";
import User from "../models/User.js";
import { StatusCodes } from "http-status-codes";
import { PasswordValidation, TokenGenerator } from "../helpers/index.js";
import {
  createHash,
  createTokenUser,
  createUserJWT,
  sendVerificationEmail,
} from "../utils/index.js";
import { TokenUser } from "../type.js";

const register = async (req: Request, res: Response): Promise<any> => {
  try {
    const { fullName, email, password, authProvider, deviceToken } = req.body;

    // Validate input
    if (!fullName || !email || !authProvider || !deviceToken) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "All fields are required." });
    }

    const exisitingUser = await User.findOne({ email });
    if (exisitingUser) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Email already in use." });
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

    const {
      finalVerificationToken,
      verificationToken,
      verificationTokenExpirationDate,
    } = await TokenGenerator();

    // Create user object
    const user = await User.create({
      fullName,
      email,
      password,
      currentDeviceToken: deviceToken,
      verificationToken: finalVerificationToken,
      verificationTokenExpirationDate: verificationTokenExpirationDate,
    });

    await sendVerificationEmail({
      email: user.email,
      verificationToken,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "User registered successfully, Please check your email for OTP",
      email: user.email,
    });
  } catch (error) {
    console.error("Error signing up:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// verifyEmail
const verifyEmail = async (req: Request, res: Response): Promise<any> => {
  try {
    const { verificationToken, email } = req.body;

    if (!verificationToken || !email) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Please provide all values",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "User not found with this email",
      });
    }

    const currentDate = new Date();

    if (
      user.verificationToken !== createHash(verificationToken) ||
      (user.verificationTokenExpirationDate &&
        user.verificationTokenExpirationDate < currentDate)
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Verification Failed, Token Incorrect",
      });
      // return
    }

    if (!user.isVerified) {
      user.isVerified = true;
      user.verificationToken = "";
      user.verified = new Date();
      await user.save();

      res.status(StatusCodes.OK).json({
        success: true,
        message: "Email Verified, please proceed to finishing your onboarding",
      });
    } else {
      res.status(StatusCodes.OK).json({
        success: true,
        message: "Email is already verified, please kindly proceed to login",
        email: user.email,
      });
    }
  } catch (error) {
    console.error("Verifying email error", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// resendToken
const resendToken = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Please provide all values",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Tutor not found with this email",
      });
    }

    const {
      finalVerificationToken,
      verificationToken,
      verificationTokenExpirationDate,
    } = await TokenGenerator();

    await sendVerificationEmail({
      email,
      verificationToken,
    });

    user.verificationToken = finalVerificationToken;
    user.verificationTokenExpirationDate = verificationTokenExpirationDate;
    await user.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Verification Token sent, please kindly check your email",
    });
  } catch (error) {
    console.error("Resending verification token error", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password, authProvider, deviceToken } = req.body;

    if (!email || !authProvider || !deviceToken) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "All fields are required." });
    }

    // Find user by email
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Invalid Credentials" });
    }

    if (user.accountClosed) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Your account has been closed.",
      });
    }

    // Handle manual authentication
    if (authProvider === "manual") {
      if (!password) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Password is required for manual login.",
        });
      }

      // Check if password exists on the user object
      if (!user.password) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "No password set for this account.",
        });
      }

      const isPasswordCorrect = await user.comparePassword(password);
      if (!isPasswordCorrect) {
        return res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ success: false, message: "Invalid Credentials" });
      }

      if (!user.isVerified) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ success: false, message: "Please verify your email" });
      }

      // Restrict login if user is already logged in from a different device
      if (user.isLoggedIn && user.currentDeviceToken !== deviceToken) {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message:
            "You are already logged in on another device. Please logout first.",
        });
      }

      // Update user session
      user.currentDeviceToken = deviceToken;
      user.isLoggedIn = true;

      // Add to deviceTokens if not already present
      if (!user.deviceTokens?.includes(deviceToken)) {
        user.deviceTokens?.push(deviceToken);
      }

      user.loggedInTimes = (user.loggedInTimes || 0) + 1;
      user.lastLoggedIn = new Date();

      await user.save();

      // Ensure required fields are not undefined
      if (!user._id || !user.email || user.fullName == null) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ success: false, message: "Incomplete admin data" });
      }

      const tokenUser: TokenUser = createTokenUser({
        userId: user?._id?.toString() || "",
        email: user?.email || "",
        fullName: user?.fullName || "",
      });

      const token = createUserJWT(tokenUser);

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
    console.error("Error logging in:", error);
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
    user.currentDeviceToken = undefined;

    await user.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Error logging out:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export { register, verifyEmail, resendToken, login, logout };
