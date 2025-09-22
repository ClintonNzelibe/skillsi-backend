import mongoose, { Schema, Document, Types } from "mongoose";

export interface IShortLink extends Document {
  course: Types.ObjectId;
  customer: Types.ObjectId;
  customerModel: "Tutor" | "Affiliate";
  shortCode: string;
  totalEarnings?: number;
  totalEnrollments?: number;
  numberOfClicks?: number;
  status?: "active" | "inactive";

  updatedAt: Date;
  createdAt: Date;
}

const ShortLinkSchema: Schema<IShortLink> = new Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Please provide course id"],
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "customerModel",
      required: [true, "Please provide the customer id"],
    },
    customerModel: {
      type: String,
      required: [true, "Please provide customer model"],
      enum: ["Tutor", "Affiliate"], // models it can point to
    },
    shortCode: {
      type: String,
      required: [true, "Please provide the short code"],
      unique: true,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    totalEnrollments: {
      type: Number,
      default: 0,
    },
    numberOfClicks: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default mongoose.model<IShortLink>("ShortLink", ShortLinkSchema);
