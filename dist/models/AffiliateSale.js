import mongoose, { Schema } from "mongoose";
const AffiliateSaleSchema = new Schema({
    courseId: {
        type: Schema.Types.ObjectId,
        ref: "Course",
        required: true,
    },
    buyerId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    affiliateId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    shortCode: {
        type: String,
        required: [true, "Please provide a short link"],
        trim: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    commission: {
        type: Number,
        required: true,
    },
    saleDate: {
        type: Date,
        default: Date.now,
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "paid"],
        default: "pending",
    },
});
export default mongoose.model("AffiliateSale", AffiliateSaleSchema);
