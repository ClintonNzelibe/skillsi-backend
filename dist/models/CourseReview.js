import mongoose, { Schema } from "mongoose";
const CourseReviewSchema = new Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: [true, "Please provide course id"],
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Please provide user id"],
    },
    tutor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tutor",
        required: [true, "Please provide tutor id"],
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
export default mongoose.model("CourseReview", CourseReviewSchema);
