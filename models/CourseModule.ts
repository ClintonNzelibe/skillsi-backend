import mongoose, { Schema, Document, Types } from "mongoose";

// Course Module Interface
interface ICourseModule extends Document {
  course: Types.ObjectId; // reference to Course
  title: string;
  description: string;
}

// Course Module Schema
const CourseModuleSchema: Schema<ICourseModule> = new Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Please provide course id"],
      trim: true,
    },
    title: {
      type: String,
      required: [true, "Please provide the title"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Please provide description"],
      trim: true,
    },
  },
  { timestamps: true }
);

// Export course Model
export default mongoose.model<ICourseModule>(
  "CourseModule",
  CourseModuleSchema
);
