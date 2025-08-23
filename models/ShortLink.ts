import mongoose, { Schema, Document, Types } from "mongoose";

export interface IShortLink extends Document {
  course: Types.ObjectId;
  affiliate: Types.ObjectId;
  shortCode: string;
  totalEarnings?: number;
  totalEnrollments?: number;
  numberOfClicks?: number;
  status?: "active" | "inactive";

  updatedAt: Date;
  createdAt: Date;
}

const ShortLinkSchema: Schema = new Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Please provide course id"],
    },
    affiliate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Affiliate",
      required: [true, "Please provide affiliate id"],
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

export default mongoose.model("ShortLink", ShortLinkSchema);
