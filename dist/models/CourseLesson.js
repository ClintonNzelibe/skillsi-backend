import mongoose, { Schema } from "mongoose";
// Course Lesson Schema
const CourseLessonSchema = new Schema({
    module: {
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
}, { timestamps: true });
// Export lesson Model
export default mongoose.model("CourseLesson", CourseLessonSchema);
