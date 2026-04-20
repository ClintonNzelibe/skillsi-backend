import mongoose, { Schema } from "mongoose";
const NotificationSchema = new Schema({
    title: {
        type: String,
        required: [true, "Please provide a title for the notification"],
        trim: true,
    },
    messageText: {
        type: String,
        required: [true, "Please provide a message text for the notification"],
        trim: true,
    }, // preview text
    messageHtml: {
        type: String,
        required: [true, "Please provide a message html for the notification"],
        trim: true,
    }, // full HTML body
    isHtml: { type: Boolean, default: true },
    ctaUrl: { type: String, trim: true }, // optional quick link
    meta: { type: Object }, // any extra data
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Or "Admin" depending on your setup
        required: [true, "Please provide a recipient for the notification"],
    },
    status: {
        type: String,
        enum: ["read", "unread"],
        default: "unread",
    },
    type: {
        type: String,
        enum: ["system", "course", "payment", "other"],
        default: "system",
    },
}, { timestamps: true });
export default mongoose.model("Notification", NotificationSchema);
