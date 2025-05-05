import mongoose, { Schema, Document, Types } from "mongoose";

interface IPurchasedCourse extends Document {
  purchasedBy: Types.ObjectId; // Reference to User
  course: Types.ObjectId; // Reference to Course
  purchasedAt: Date;
  isCompleted: boolean;
  paymentReference: string; // Optional: for payment verification
  overallCompletionPercent: number; // Optional: For tracking overall completion percentage
}

const PurchasedCourseSchema: Schema<IPurchasedCourse> = new Schema(
  {
    purchasedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    purchasedAt: {
      type: Date,
      default: Date.now,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    paymentReference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    overallCompletionPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IPurchasedCourse>(
  "PurchasedCourse",
  PurchasedCourseSchema
);
