import mongoose, { Schema } from "mongoose";
import Tutor from "./Tutor.js";
const TutorReviewSchema = new Schema({
    tutor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tutor",
        required: [true, "Please provide tutor id"],
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Please provide user id"],
    },
    rating: {
        type: Number,
        required: [true, "Please provide a rating"],
        min: 1,
        max: 5,
    },
    comment: {
        type: String,
        required: [true, "Please provide a comment"],
        trim: true,
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "approved",
    },
}, { timestamps: true });
// Prevent multiple reviews from same user for the same tutor
TutorReviewSchema.index({ tutor: 1, user: 1 }, { unique: true });
// Function to update tutor's average rating and total reviews
async function updateTutorStats(tutorId) {
    const stats = await mongoose.model("TutorReview").aggregate([
        { $match: { tutor: tutorId, status: "approved" } },
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
            rating: stats[0].averageRating,
            totalReviews: stats[0].totalReviews,
        });
    }
    else {
        await Tutor.findByIdAndUpdate(tutorId, {
            rating: 0,
            totalReviews: 0,
        });
    }
}
// Post-save hook
TutorReviewSchema.post("save", async function () {
    await updateTutorStats(this.tutor);
});
// Post-remove hook
// Post-delete hook (query middleware for findOneAndDelete)
TutorReviewSchema.post("findOneAndDelete", async function (doc) {
    if (doc) {
        await updateTutorStats(doc.tutor);
    }
});
export default mongoose.model("TutorReview", TutorReviewSchema);
