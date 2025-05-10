import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import Tutor from "../models/Tutor";
import {
  DeleteFileFromCloudinary,
  UploadFileToCloudinary,
} from "../helpers/index.js";

const updateTutorProfile = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { bio, expertise, profilePicture, socialLinks } = req.body;

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
        message: "Tutor not found",
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
    if (bio !== undefined) tutor.bio = bio;
    if (expertise !== undefined) tutor.expertise = expertise;
    if (socialLinks !== undefined) tutor.socialLinks = socialLinks;

    tutor.isProfileComplete = !!(
      tutor.bio &&
      tutor.expertise?.length &&
      tutor.profilePicture
    );

    await tutor.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Tutor profile updated successfully",
      tutor: {
        _id: tutor._id,
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
        .json({ success: false, message: "tutor doesn't exist" });
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

export { updateTutorProfile, currentTutor };
