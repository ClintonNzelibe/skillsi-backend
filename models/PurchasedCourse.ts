import mongoose, { Schema, Document, Types } from "mongoose";

interface IPurchasedCourse extends Document {
  customer: Types.ObjectId; // Reference to User
  course: Types.ObjectId; // Reference to Course
  purchasedAt: Date;
  isCompleted: boolean;
  paymentReference: string; // Optional: for payment verification
  transactionId: string;
  authorizationCode: string;
  amountPaid: number;
  overallCompletionPercent: number; // Optional: For tracking overall completion percentage
}

const PurchasedCourseSchema: Schema<IPurchasedCourse> = new Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please provider user id"],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Please provide course id"],
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
      required: [true, "Please provide payment reference"],
      unique: true,
      trim: true,
    },
    transactionId: {
      type: String,
      required: [true, "Please provide transaction id"],
      unique: true,
      trim: true,
    },
    authorizationCode: {
      type: String,
      required: [true, "Please provide authorization code"],
      unique: true,
      trim: true,
    },
    amountPaid: {
      type: Number,
      required: [true, "Please provide amount"],
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
