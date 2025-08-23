import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICourseQA extends Document {
  course: Types.ObjectId;
  tutor?: Types.ObjectId;
  user: Types.ObjectId;
  question: string;
  answer?: string;
  answeredBy?: Types.ObjectId;
  isAnswered: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CourseQASchema: Schema<ICourseQA> = new Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Please provide course id"],
    },
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
    question: {
      type: String,
      required: [true, "Please provide question"],
      trim: true,
    },
    answer: {
      type: String,
      trim: true,
    },
    answeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tutor", // or "Admin" if answers can come from others
    },
    isAnswered: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model<ICourseQA>("CourseQA", CourseQASchema);
