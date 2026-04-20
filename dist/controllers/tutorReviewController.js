import { StatusCodes } from "http-status-codes";
import Tutor from "../models/Tutor.js";
import TutorReview from "../models/TutorReview.js";
// Helper to update tutor stats
const updateTutorStats = async (tutorId) => {
    const stats = await TutorReview.aggregate([
        { $match: { tutor: tutorId } },
        {
            $group: {
                _id: "$tutor",
                rating: { $avg: "$rating" },
                totalReviews: { $sum: 1 },
            },
        },
    ]);
    if (stats.length > 0) {
        await Tutor.findByIdAndUpdate(tutorId, {
            rating: stats[0].avgRating,
            totalReviews: stats[0].totalReviews,
        });
    }
    else {
        await Tutor.findByIdAndUpdate(tutorId, {
            rating: 0,
            totalReviews: 0,
        });
    }
};
/**
 * Create a tutor review
 */
const createTutorReview = async (req, res) => {
    try {
        const { tutor, rating, comment } = req.body;
        const userId = req.user?.userId;
        if (!tutor || !rating || !comment) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Tutor, rating, and comment are required",
            });
        }
        // Check if user already reviewed this tutor
        const existingReview = await TutorReview.findOne({ tutor, user: userId });
        if (existingReview) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "You have already reviewed this tutor",
            });
        }
        const review = await TutorReview.create({
            tutor,
            user: userId,
            rating,
            comment,
        });
        await updateTutorStats(review.tutor);
        res.status(StatusCodes.CREATED).json({
            success: true,
            message: "Review created successfully",
            review,
        });
    }
    catch (error) {
        console.error("Error creating tutor review:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
/**
 * Edit a tutor review
 */
const editTutorReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user?.userId;
        const review = await TutorReview.findOne({ _id: reviewId, user: userId });
        if (!review) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Review not found",
            });
        }
        if (rating)
            review.rating = rating;
        if (comment)
            review.comment = comment;
        await review.save();
        await updateTutorStats(review.tutor);
        res.status(StatusCodes.OK).json({
            success: true,
            message: "Review updated successfully",
            review,
        });
    }
    catch (error) {
        console.error("Error editing tutor review:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
/**
 * Delete a tutor review
 */
const deleteTutorReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user?.userId;
        const review = await TutorReview.findOneAndDelete({
            _id: reviewId,
            user: userId,
        });
        if (!review) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Review not found",
            });
        }
        await updateTutorStats(review.tutor);
        res.status(StatusCodes.OK).json({
            success: true,
            message: "Review deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting tutor review:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
/**
 * Fetch all reviews for a tutor
 */
const fetchTutorReviews = async (req, res) => {
    try {
        const { tutorId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const reviews = await TutorReview.find({ tutor: tutorId })
            .populate("user", "fullName profilePicture")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const totalReviews = await TutorReview.countDocuments({ tutor: tutorId });
        const totalPages = Math.ceil(totalReviews / limit);
        res.status(StatusCodes.OK).json({
            success: true,
            message: "Tutor reviews fetched successfully",
            reviews,
            page,
            totalReviewsPerPage: reviews.length,
            totalPages,
            totalReviews,
        });
    }
    catch (error) {
        console.error("Error fetching tutor reviews:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
export { createTutorReview, editTutorReview, deleteTutorReview, fetchTutorReviews, };
