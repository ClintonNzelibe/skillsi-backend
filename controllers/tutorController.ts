import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import Tutor from "../models/Tutor.js";
import Course from "../models/Course.js";
import TutorReview from "../models/TutorReview.js";
import {
  DeleteFileFromCloudinary,
  PasswordValidation,
  TokenGenerator,
  UploadFileToCloudinary,
} from "../helpers/index.js";
import { createHash, sendResetPasswordEmail } from "../utils/index.js";

const updateTutorProfile = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { fName, lName, bio, expertise, profilePicture, socialLinks } =
      req.body;

    const tutorId = req.tutor?.tutorId;

    if (!tutorId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Unauthorized Tutor",
      });
    }

    const tutor = await Tutor.findById(tutorId);
    if (!tutor) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Tutor not found with this email",
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

    // Fields allowed to be updated
    if (fName !== undefined) tutor.fName = fName;
    if (lName !== undefined) tutor.lName = lName;
    if (bio !== undefined) tutor.bio = bio;
    if (expertise !== undefined) tutor.expertise = expertise;
    if (socialLinks !== undefined) tutor.socialLinks = socialLinks;

    tutor.isProfileComplete = !!(
      fName &&
      lName &&
      tutor.bio &&
      tutor.expertise?.length &&
      tutor.profilePicture
    );

    await tutor.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Tutor profile updated successfully",
      tutor: {
        affiliateId: tutor._id,
        fName: tutor.fName,
        lName: tutor.lName,
        email: tutor.email,
        bio: tutor.bio,
        expertise: tutor.expertise,
        profilePicture: tutor.profilePicture,
        socialLinks: tutor.socialLinks,
        isProfileComplete: tutor.isProfileComplete,
      },
    });
  } catch (error) {
    console.error("Error updating tutor profile", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const currentTutor = async (req: Request, res: Response): Promise<any> => {
  try {
    const tutor = await Tutor.findOne({ _id: req.tutor?.tutorId });

    if (!tutor) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Tutor doesn't exist" });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Fetched Succesfully",
      tutor: {
        tutorId: tutor._id,
        fName: tutor.fName,
        lName: tutor.lName,
        email: tutor.email,
        profilePicture: tutor.profilePicture,
        socialLinks: tutor.socialLinks,
        bio: tutor.bio,
        expertise: tutor.expertise,
        isProfileComplete: tutor.isProfileComplete,
        totalCourses: tutor.totalCourses,
        rating: tutor.rating,
      },
    });
  } catch (error) {
    console.error("Error getting current tutor", error);
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

    const tutor = await Tutor.findOne({ email });
    if (!tutor) {
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
      fName: tutor.fName,
      email: tutor.email,
      verificationToken,
    });

    tutor.resetToken = finalVerificationToken;
    tutor.resetTokenExpirationDate = verificationTokenExpirationDate;
    await tutor.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Please check your email for OTP",
      email: tutor.email,
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// verifyEmailResetPassword
const verifyTokenResetPassword = async (
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
    const tutor = await Tutor.findOne({ email });

    if (!tutor) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Email doesn't exist" });
    }

    const currentDate = new Date();

    if (
      tutor.resetToken === createHash(verificationToken) &&
      tutor.resetTokenExpirationDate > currentDate
    ) {
      tutor.isResetTokenVerified = true;
      tutor.resetToken = "";
      tutor.resetTokenExpirationDate = new Date();
      await tutor.save();

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

    const tutor = await Tutor.findOne({ email }).select("+password");
    if (!tutor) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Tutor not found with this email" });
    }

    if (!tutor.isResetTokenVerified) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ success: false, message: "Please verify your email" });
    }

    tutor.password = newPassword;
    tutor.isResetTokenVerified = true;
    await tutor.save();

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

    const tutor = await Tutor.findOne({ email });

    if (!tutor) {
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
      fName: tutor.fName,
      email,
      verificationToken,
    });

    tutor.resetToken = finalVerificationToken;
    tutor.resetTokenExpirationDate = verificationTokenExpirationDate;
    await tutor.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: "OTP sent, please kindly check your email",
      email: tutor.email,
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

    const email = req.tutor?.email;

    const tutor = await Tutor.findOne({ email }).select("+password");
    if (!tutor) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Tutor not found with this email" });
    }

    const isPasswordCorrect = await tutor.comparePassword(password);
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

    tutor.password = newPassword;
    await tutor.save();

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

/**
 * Get tutor profile details
 */
const getTutorProfile = async (req: Request, res: Response): Promise<any> => {
  try {
    const { tutorId } = req.params;

    // Fetch tutor details without sensitive fields
    const tutor = await Tutor.findById(tutorId)
      .select(
        "fName lName bio totalStudents totalReview socialLinks profilePicture expertise rating"
      )
      .lean();

    if (!tutor) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Tutor not found",
      });
    }

    // Fetch tutor's courses
    const courses = await Course.find({ tutor: tutorId })
      .select("title description bannerImage rating totalReview _id")
      .lean();

    // Fetch tutor reviews (latest first)
    const reviews = await TutorReview.find({ tutor: tutorId })
      .populate("user", "fName lName profilePicture")
      .select("rating comment user createdAt")
      .sort({ createdAt: -1 })
      .lean();

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Tutor profile fetched successfully",
      tutor: {
        ...tutor,
        courses: courses.map((course) => ({
          courseId: course._id,
          title: course.title,
          description: course.description,
          bannerImage: course.bannerImage,
          rating: course.rating,
          totalReview: course.totalReview,
        })),
        reviews: reviews.map((review) => ({
          reviewId: review._id,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
          user: review.user,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching tutor profile:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const dashboardData = async (req: Request, res: Response): Promise<any> => {
  try {
    const { dataType } = req.query;
    const tutorId = req.tutor?.tutorId;
    const tutor = await Tutor.findById(tutorId);

    if (!tutor) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Tutor doesn't exist",
      });
    }

    let data: any = {};
    if (dataType === "earnings") {
      data = {
        balance: tutor.balance,
        totalRevenue: tutor.totalRevenue,
        totalWithdrawals: tutor.totalWithdrawals,
        pendingWithdrawals: tutor.pendingWithdrawals,
      };
    } else if (dataType === "courseOverview") {
      data = {
        totalRevenue: tutor.totalRevenue,
        totalCourses: tutor.totalCourses,
        totalEnrollments: tutor.totalEnrollments,
      };
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Dashboard data fetched successfully",
      data,
    });
  } catch (error) {
    console.error("Error getting dashboard  data", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const fetchAllTutors = async (req: Request, res: Response): Promise<any> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 50;
    const skip = (page - 1) * limit;
    const { search, status = "approved" } = req.query;

    let filter: any = {};

    const andFilters: any[] = [];
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

    const tutors = await Tutor.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .select(
        "fName lName email profilePicture rating totalCourses totalRevenue"
      );

    if (!tutors || tutors.length === 0) {
      return res.status(StatusCodes.OK).json({
        success: false,
        message: "No tutors found",
        tutors: [],
      });
    }

    const totalTutorsCount = await Tutor.countDocuments(filter);
    const totalPages = Math.ceil(totalTutorsCount / limit);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Tutors fetched successfully",
      tutors,
      page,
      totalTutorPerPage: tutors.length,
      totalPages,
      totalTutors: totalTutorsCount,
    });
  } catch (error) {
    console.error("Error fetching all tutors:", error);

    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const fetchSingleTutor = async (req: Request, res: Response): Promise<any> => {
  try {
    const { tutorId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 50;
    const skip = (page - 1) * limit;
    const { tab = "courses" } = req.query;

    if (!tutorId) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Tutor ID is required" });
    }

    const tutor = await Tutor.findById(tutorId)
      .select(
        "fName lName email profilePicture phoneNumber status createdAt totalRevenue"
      )
      .lean();
    if (!tutor) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Tutor not found" });
    }

    let data: any[] = [];
    let totalCounts = 0;
    let totalPages = 0;
    let totalCountPerPage = 0;

    if (tab === "courses") {
      totalCounts = await Course.countDocuments({
        tutor: tutorId,
      });
      totalPages = Math.ceil(totalCounts / limit);

      
    } else if (tab === "earnings") {
    } else if (tab === "reviews") {
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Tutor fetched successfully",
      tutor,
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
  updateTutorProfile,
  currentTutor,
  forgotPassword,
  verifyTokenResetPassword,
  resetPassword,
  resendToken,
  changePassword,
  getTutorProfile,
  dashboardData,
  fetchAllTutors,
  fetchSingleTutor,
};
