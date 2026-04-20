import mongoose, { Schema } from "mongoose";
// Course Module Schema
const CourseModuleSchema = new Schema({
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
}, { timestamps: true });
// Export course Model
export default mongoose.model("CourseModule", CourseModuleSchema);
