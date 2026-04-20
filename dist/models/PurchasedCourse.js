import mongoose, { Schema } from "mongoose";
const PurchasedCourseSchema = new Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Please provider user id"],
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: [true, "Please provide course id"],
    },
    purchasedAt: {
        type: Date,
        default: Date.now,
    },
    isCompleted: {
        type: Boolean,
        default: false,
    },
    paymentReference: {
        type: String,
        required: [true, "Please provide payment reference"],
        unique: true,
        trim: true,
    },
    transactionId: {
        type: String,
        required: [true, "Please provide transaction id"],
        unique: true,
        trim: true,
    },
    authorizationCode: {
        type: String,
        required: [true, "Please provide authorization code"],
        unique: true,
        trim: true,
    },
    amountPaid: {
        type: Number,
        required: [true, "Please provide amount"],
    },
    overallCompletionPercent: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },
}, { timestamps: true });
export default mongoose.model("PurchasedCourse", PurchasedCourseSchema);
