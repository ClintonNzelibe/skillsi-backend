import mongoose, { Schema, Document, Types } from "mongoose";

interface IProgress extends Document {
  user: Types.ObjectId;
  status: "not-started" | "in-progress" | "completed";
  totalScore: number;
  overallCompletion: number;
  trainingId: Types.ObjectId;
  lessonProgress: Map<
    string,
    {
      score: number;
      completionStatus: "not-started" | "in-progress" | "completed";
      attempts: number;
    }
  >;
  moduleCompletion: Map<string, number>;
}

// Progress Schema
const AwarenessTrainingProgressSchema = new Schema<IProgress>(
  {
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
  },
  { timestamps: true }
);

export default mongoose.model<IProgress>(
  "AwarenessTrainingProgress",
  AwarenessTrainingProgressSchema
);
