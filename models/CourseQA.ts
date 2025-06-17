import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICourseQA extends Document {
  courseId: Types.ObjectId;
  askedBy: Types.ObjectId;
  question: string;
  answer?: string;
  answeredBy?: Types.ObjectId;
  isAnswered: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CourseQASchema: Schema<ICourseQA> = new Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    askedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    question: {
      type: String,
      required: true,
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
