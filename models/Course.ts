import mongoose, { Schema, Document, Types } from "mongoose";

// Course Interface
interface ICourse extends Document {
  bannerImage: string; // URL or file path
  title: string;
  subTitle: string;
  description: string;
  objectives: [string];
  requirements: [string];
  targetAudience: [string];
  category: String;
  subcategory: String;
  noOfStudents: number;
  language: string;
  otherLanguages: [string];
  thumbnail: String;
  rating: number;
  totalRating: number;
  totalUserRated: number;
  promoVideoUrl: String;
  priceInNaira: number;
  priceInDollar: number;
  priceInPounds: number;
  tutor: Types.ObjectId;
}

// Course Schema
const CourseSchema: Schema<ICourse> = new Schema(
  {
    bannerImage: {
      type: String,
      required: [true, "Please provide banner image"],
      trim: true,
    },
    title: {
      type: String,
      required: [true, "Please provide the title"],
      trim: true,
    },
    subTitle: {
      type: String,
      required: [true, "Please provide the subtitle"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Please provide description"],
      trim: true,
    },
    objectives: {
      type: [String],
      required: [true, "Please provide objectives"],
      trim: true,
    },
    requirements: {
      type: [String],
      required: [true, "Please provide requirements"],
      trim: true,
    },
    targetAudience: {
      type: [String],
      required: [true, "Please provide target audience"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Please provide category"],
      trim: true,
    },
    subcategory: {
      type: String,
      required: [true, "Please provide subcategory"],
      trim: true,
    },
    noOfStudents: {
      type: Number,
      required: [true, "Please provide number of students"],
      trim: true,
    },
    language: {
      type: String,
      required: [true, "Please provide language"],
      trim: true,
    },
    otherLanguages: {
      type: [String],
      required: [true, "Please provide other languages"],
      trim: true,
    },
    thumbnail: {
      type: String,
      required: [true, "Please provide thumbnail"],
      trim: true,
    },
    promoVideoUrl: {
      type: String,
      required: [true, "Please provide promo video URL"],
      trim: true,
    },
    priceInNaira: {
      type: Number,
      required: [true, "Please provide price in Naira"],
      trim: true,
    },
    priceInDollar: {
      type: Number,
      required: [true, "Please provide price in Dollar"],
      trim: true,
    },
    priceInPounds: {
      type: Number,
      required: [true, "Please provide price in Pounds"],
      trim: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRating: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalUserRated: {
      type: Number,
      default: 0,
      min: 0,
    },
    tutor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tutor",
      required: true,
    },
  },
  { timestamps: true }
);

// Export course Model
export default mongoose.model<ICourse>("Course", CourseSchema);
