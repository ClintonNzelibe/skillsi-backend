import { Request, Response } from "express";
import Affiliate from "../models/Affiliate.js";
import { StatusCodes } from "http-status-codes";
import {
  createHash,
  createTokenAffiliate,
  createAffiliateJWT,
  sendVerificationEmail,
} from "../utils/index.js";
import { TokenAffiliate } from "../type.js";
import { PasswordValidation, TokenGenerator } from "../helpers/index.js";

const signupAffiliate = async (req: Request, res: Response): Promise<any> => {
  try {
    const { firstName, lastName, userName, email, password, confirmPassword } =
      req.body;

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingAffiliate = await Affiliate.findOne({ email });
    if (existingAffiliate) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Email already exists",
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

    if (password !== confirmPassword) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Password and Confirm Password doesn't match.",
      });
    }

    const {
      finalVerificationToken,
      verificationToken,
      verificationTokenExpirationDate,
    } = await TokenGenerator();

    const affiliate = await Affiliate.create({
      firstName,
      lastName,
      userName,
      email,
      password,
      verificationToken: finalVerificationToken,
      verificationTokenExpirationDate: verificationTokenExpirationDate,
    });

    await sendVerificationEmail({
      email: affiliate.email,
      verificationToken,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Affiliate registered successfully, Please check your email for OTP",
      email: affiliate.email,
    });
  } catch (error) {
    console.error("Signup error", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal Server Error",
    });
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

    const affiliate = await Affiliate.findOne({ email });

    if (!affiliate) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Affiliate not found with this email",
      });
    }

    const currentDate = new Date();

    if (
      affiliate.verificationToken !== createHash(verificationToken) ||
      (affiliate.verificationTokenExpirationDate &&
        affiliate.verificationTokenExpirationDate < currentDate)
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Verification Failed, Token Incorrect",
      });
      // return
    }

    if (!affiliate.isVerified) {
      affiliate.isVerified = true;
      affiliate.verificationToken = "";
      affiliate.verified = new Date();
      await affiliate.save();

      res.status(StatusCodes.OK).json({
        success: true,
        message: "Email Verified, please kindly proceed to login",
      });
    } else {
      res.status(StatusCodes.OK).json({
        success: true,
        message: "Email is already verified, please kindly proceed to login",

        email: affiliate.email,
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

    const affiliate = await Affiliate.findOne({ email });

    if (!affiliate) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "affiliate not found with this email",
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

    affiliate.verificationToken = finalVerificationToken;
    affiliate.verificationTokenExpirationDate = verificationTokenExpirationDate;
    await affiliate.save();

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

const signinAffiliate = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Please provide all values",
      });
    }

    const affiliate = await Affiliate.findOne({ email }).select("+password");
    if (!affiliate) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isPasswordCorrect = await affiliate.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!affiliate.isVerified) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Please verify your email" });
    }

    if (affiliate.status !== "approved") {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: `Account is ${affiliate.status}`,
      });
    }

    // Ensure required fields are not undefined
    if (
      !affiliate._id ||
      !affiliate.email ||
      !affiliate.firstName ||
      !affiliate.lastName ||
      !affiliate.userName
    ) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Incomplete affiliate data" });
    }

    const tokenaffiliate: TokenAffiliate = createTokenAffiliate({
      affiliateId: affiliate?._id?.toString() || "",
      email: affiliate?.email || "",
      firstName: affiliate?.firstName || "",
      lastName: affiliate?.lastName || "",
      userName: affiliate?.userName || "",
    });

    const token = createAffiliateJWT(tokenaffiliate);

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

export { signupAffiliate, verifyEmail, resendToken, signinAffiliate };
