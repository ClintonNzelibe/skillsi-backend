import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICourseReview extends Document {
  course: Types.ObjectId;
  user: Types.ObjectId;
  tutor: Types.ObjectId;
  rating: number;
  comment: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

const CourseReviewSchema: Schema<ICourseReview> = new Schema(
  {
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
  },
  { timestamps: true }
);

export default mongoose.model<ICourseReview>(
  "CourseReview",
  CourseReviewSchema
);
