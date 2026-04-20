import mongoose, { Schema } from "mongoose";
const ShortLinkSchema = new Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: [true, "Please provide course id"],
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "customerModel",
        required: [true, "Please provide the customer id"],
    },
    customerModel: {
        type: String,
        required: [true, "Please provide customer model"],
        enum: ["Tutor", "Affiliate"], // models it can point to
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
}, { timestamps: true });
export default mongoose.model("ShortLink", ShortLinkSchema);
