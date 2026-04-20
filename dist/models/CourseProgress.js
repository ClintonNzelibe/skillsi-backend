import mongoose, { Schema } from "mongoose";
// Progress Schema
const AwarenessTrainingProgressSchema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
        type: String,
        enum: ["not-started", "in-progress", "completed"],
        default: "not-started",
    },
    totalScore: { type: Number, default: 0 },
    overallCompletion: { type: Number, default: 0 },
    trainingId: {
        type: Schema.Types.ObjectId,
        ref: "AwarenessTraining",
        required: true,
    },
    lessonProgress: {
        type: Map,
        of: {
            score: { type: Number, default: 0 },
            completionStatus: {
                type: String,
                enum: ["not-started", "in-progress", "completed"],
                default: "not-started",
            },
            attempts: { type: Number, default: 0 },
        },
    },
    moduleCompletion: {
        type: Map,
        of: { type: Number, default: 0 }, // percentage completion per module
    },
}, { timestamps: true });
export default mongoose.model("AwarenessTrainingProgress", AwarenessTrainingProgressSchema);
