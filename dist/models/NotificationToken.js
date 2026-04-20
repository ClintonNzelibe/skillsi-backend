import mongoose from "mongoose";
const NotificationTokenSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Please provide user ID"],
    },
    token: {
        type: String,
        required: [true, "Please provide user push notification token"],
    },
    deviceType: {
        type: String,
        enum: ["android", "ios", "web"],
        default: "android",
    },
}, { timestamps: true });
NotificationTokenSchema.pre("save", function (next) {
    this.updatedAt = new Date();
    next();
});
export default mongoose.model("NotificationToken", NotificationTokenSchema);
