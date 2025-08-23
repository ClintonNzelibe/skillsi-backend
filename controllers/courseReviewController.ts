// Required imports
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import Course from "../models/Course.js";
import CourseReview from "../models/CourseReview.js";

// Create review
const createReview = async (req: Request, res: Response): Promise<any> => {
  try {
    const { courseId } = req.query;
    const { rating, comment } = req.body;
    const userId = req.user?.userId;
    // const tutorId = req.body.tutorId; // could also be fetched via course if needed

    const courseForId = await Course.findById(courseId).select("tutor");
    if (!courseForId) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Course not Found" });
    }
    const tutorId = courseForId?.tutor;

    if (!rating || !comment) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Rating and comment required" });
    }

    const review = await CourseReview.create({
      course: courseId,
      user: userId,
      tutor: tutorId,
      rating,
      comment,
    });

    // Update course rating
    const course = await Course.findById(courseId);
    if (course) {
      course.totalRating += rating;
      course.totalUserRated += 1;
      course.rating = parseFloat(
        (course.totalRating / course.totalUserRated).toFixed(1)
      );
      await course.save();
    }

    res
      .status(StatusCodes.CREATED)
      .json({ success: true, message: "Review submitted", data: review });
  } catch (error) {
    console.error("Create Review Error:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// Fetch user reviews
const getUserReviews = async (req: Request, res: Response): Promise<any> => {
  try {
    const { courseId } = req.query;
    const userId = req.user?.userId;

    // Get current user review regardless of status
    const userReview = await CourseReview.findOne({
      course: courseId,
      user: userId,
    }).populate("course user tutor");

    // Get other users' approved reviews only
    const otherReviews = await CourseReview.find({
      course: courseId,
      status: "approved",
      user: { $ne: userId },
    }).populate("course user tutor");

    // Merge: put userReview at top (if exists)
    const reviews = userReview ? [userReview, ...otherReviews] : otherReviews;

    res
      .status(StatusCodes.OK)
      .json({ success: true, message: "Fetched Successfully", reviews });
  } catch (error) {
    console.log("Error get reviews for user", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// Fetch tutor reviews
const getTutorReviews = async (req: Request, res: Response): Promise<any> => {
  try {
    const { courseId } = req.body;
    const tutorId = req.tutor?.tutorId;
    const reviews = await CourseReview.find({
      course: courseId,
      tutor: tutorId,
    }).populate("user course");

    res
      .status(StatusCodes.OK)
      .json({ success: true, message: "Fetched Successfully", data: reviews });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// Update review (user only)
const updateReview = async (req: Request, res: Response): Promise<any> => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const review = await CourseReview.findById(reviewId);

    if (!review) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Review not found" });
    }

    if (review.user.toString() !== req.user?.userId) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ success: false, message: "Unauthorized to edit the comment" });
    }

    // Revert old rating
    const course = await Course.findById(review.course);
    if (course) {
      course.totalRating -= review.rating;
      course.totalRating += rating;
      course.rating = parseFloat(
        (course.totalRating / course.totalUserRated).toFixed(1)
      );
      await course.save();
    }

    review.rating = rating;
    review.comment = comment;
    review.status = "approved";
    await review.save();

    res
      .status(StatusCodes.OK)
      .json({ success: true, message: "Review updated", data: review });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// Delete review (user or tutor)
const deleteReview = async (req: Request, res: Response): Promise<any> => {
  try {
    const { reviewId } = req.params;
    const review = await CourseReview.findById(reviewId);

    if (!review) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Review not found" });
    }

    const userIsOwner = review.user.toString() === req.user?.userId;
    const tutorIsOwner = review.tutor.toString() === req.tutor?.tutorId;
    if (!userIsOwner && !tutorIsOwner) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ success: false, message: "Unauthorized" });
    }

    const course = await Course.findById(review.course);
    if (course) {
      course.totalRating -= review.rating;
      course.totalUserRated -= 1;
      course.rating =
        course.totalUserRated > 0
          ? parseFloat((course.totalRating / course.totalUserRated).toFixed(1))
          : 0;
      await course.save();
    }

    await review.deleteOne();
    res
      .status(StatusCodes.OK)
      .json({ success: true, message: "Review deleted" });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// Tutor approve/reject
const updateReviewStatus = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { reviewId } = req.params;
    const { status } = req.body; // "approved" | "rejected" | "pending"
    if (!["approved", "rejected", "pending"].includes(status)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Invalid status" });
    }

    const review = await CourseReview.findById(reviewId);
    if (!review)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Review not found" });

    if (review.tutor.toString() !== req.tutor?.tutorId)
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ success: false, message: "Unauthorized" });

    review.status = status;
    await review.save();

    res
      .status(StatusCodes.OK)
      .json({ success: true, message: `Review ${status}` });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export {
  createReview,
  getUserReviews,
  getTutorReviews,
  updateReview,
  deleteReview,
  updateReviewStatus,
};
