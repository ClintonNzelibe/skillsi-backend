import { Request, Response } from "express";
import Tutor from "../models/Tutor.js";
import { StatusCodes } from "http-status-codes";
import {
  createHash,
  createTokenTutor,
  createTutorJWT,
  sendVerificationEmail,
} from "../utils/index.js";
import { TokenTutor } from "../type.js";
import {
  DeleteFileFromCloudinary,
  PasswordValidation,
  TokenGenerator,
  UploadFileToCloudinary,
} from "../helpers/index.js";

const signupTutor = async (req: Request, res: Response): Promise<any> => {
  try {
    const { fName, lName, email, password, confirmPassword } = req.body;

    if (!fName || !lName || !email || !password) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingTutor = await Tutor.findOne({ email });
    if (existingTutor) {
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

    const tutor = await Tutor.create({
      fName,
      lName,
      email,
      password,
      verificationToken: finalVerificationToken,
      verificationTokenExpirationDate: verificationTokenExpirationDate,
    });

    await sendVerificationEmail({
      email: tutor.email,
      verificationToken,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Tutor registered successfully, Please check your email for OTP",
      email: tutor.email,
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

    const tutor = await Tutor.findOne({ email });

    if (!tutor) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Tutor not found with this email",
      });
    }

    const currentDate = new Date();

    if (
      tutor.verificationToken !== createHash(verificationToken) ||
      (tutor.verificationTokenExpirationDate &&
        tutor.verificationTokenExpirationDate < currentDate)
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Verification Failed, Token Incorrect",
      });
      // return
    }

    if (!tutor.isVerified) {
      tutor.isVerified = true;
      tutor.verificationToken = "";
      tutor.verified = new Date();
      await tutor.save();

      res.status(StatusCodes.OK).json({
        success: true,
        message: "Email Verified, please proceed to finishing your onboarding",
      });
    } else {
      res.status(StatusCodes.OK).json({
        success: true,
        message: "Email is already verified, please kindly proceed to login",

        email: tutor.email,
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

    const tutor = await Tutor.findOne({ email });

    if (!tutor) {
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

    tutor.verificationToken = finalVerificationToken;
    tutor.verificationTokenExpirationDate = verificationTokenExpirationDate;
    await tutor.save();

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

const signinTutor = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    const tutor = await Tutor.findOne({ email }).select("+password");
    if (!tutor) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isPasswordCorrect = await tutor.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!tutor.isVerified) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Please verify your email" });
    }

    if (tutor.status !== "approved") {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: `Account is ${tutor.status}`,
      });
    }

    // Ensure required fields are not undefined
    if (!tutor._id || !tutor.fName || !tutor.lName || !tutor.email) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Incomplete tutor data" });
    }

    const tokenTutor: TokenTutor = createTokenTutor({
      tutorId: tutor?._id?.toString() || "",
      fName: tutor?.fName || "",
      lName: tutor?.lName || "",
      email: tutor?.email || "",
    });

    const token = createTutorJWT(tokenTutor);

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

const finishOnboarding = async (req: Request, res: Response): Promise<any> => {
  try {
    const {
      email,
      expertise,
      location,
      phoneNumber,
      profilePicture,
      certificateImage,
    } = req.body;
    if (!email) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Please provide all values",
      });
    }

    const tutor = await Tutor.findOne({ email });
    if (!tutor) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Tutor not found with this email",
      });
    }

    if (
      !Array.isArray(expertise) ||
      expertise.length === 0 ||
      !expertise.every((item) => typeof item === "string")
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Expertise must be a non-empty array of strings",
      });
    }

    // Upload new profile picture if provided and different from existing
    if (profilePicture && profilePicture.startsWith("data:")) {
      // Delete existing image if it exists
      if (tutor.profilePicture) {
        await DeleteFileFromCloudinary(tutor.profilePicture);
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

      tutor.profilePicture = uploadResult?.secure_url;
    }

    // Upload new certificate image if provided and different from existing
    if (certificateImage && certificateImage.startsWith("data:")) {
      if (tutor.certificateImage) {
        await DeleteFileFromCloudinary(tutor.certificateImage);
      }

      const uploadResult = await UploadFileToCloudinary(
        certificateImage,
        {
          folder: "Tutors/CertificateImages",
          allowedFileTypes: [
            "image/png",
            "image/jpg",
            "image/jpeg",
            "application/pdf",
          ],
          maxSizeInMB: 5,
        },
        res
      );

      tutor.certificateImage = uploadResult?.secure_url;
    }

    tutor.expertise = expertise;
    if (location !== undefined) tutor.location = location;
    if (phoneNumber !== undefined) tutor.phoneNumber = phoneNumber;
    await tutor.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Tutor onboarding completed successfully",
      // tutor: {
      //   _id: tutor._id,
      //   fName: tutor.fName,
      //   lName: tutor.lName,
      //   email: tutor.email,
      //   expertise: tutor.expertise,
      //   profilePicture: tutor.profilePicture,
      // },
    });
  } catch (error) {
    console.error("finish onboarding error", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export { signupTutor, verifyEmail, resendToken, signinTutor, finishOnboarding };
