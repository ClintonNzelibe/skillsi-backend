import mongoose, { Schema, Document, Types } from "mongoose";

// Course Lesson Interface
interface ICourseLesson extends Document {
  moduleId: Types.ObjectId; // reference to Section
  title: String;
  type: String; // 'video', 'article', 'quiz', etc.
  videoUrl: String; // if type is video
  content: String; // for text/articles
  resources: [String]; // file URLs
  duration: Number; // in seconds/minutes
}

// Course Lesson Schema
const CourseLessonSchema: Schema<ICourseLesson> = new Schema(
  {
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Please provide course id"],
      trim: true,
    },
    title: {
      type: String,
      required: [true, "Please provide the title"],
      trim: true,
    },
    type: {
      type: String,
      required: [true, "Please provide description"],
      trim: true,
    },
    videoUrl: {
      type: String,
      required: function () {
        return this.type === "video";
      },
      trim: true,
    },
    content: {
      type: String,
      required: function () {
        return this.type === "article";
      },
      trim: true,
    },
    resources: {
      type: [String],
      required: function () {
        return this.type === "quiz" || this.type === "article";
      },
      trim: true,
    },
    duration: {
      type: Number,
      required: [true, "Please provide duration"],
      trim: true,
    },
  },
  { timestamps: true }
);

// Export lesson Model
export default mongoose.model<ICourseLesson>(
  "CourseLesson",
  CourseLessonSchema
);
