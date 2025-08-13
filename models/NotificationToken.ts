import mongoose, { Schema, Document } from "mongoose";

interface INotificationToken extends Document {
  user: mongoose.Types.ObjectId; // Reference to User
  token: string; // Device token
  deviceType?: "android" | "ios" | "web"; // Optional device type
  updatedAt: Date; // Timestamp for last update
}

const NotificationTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: { type: String, required: true },
    deviceType: { type: String, enum: ["android", "ios", "web"] },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

NotificationTokenSchema.pre<INotificationToken>("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model<INotificationToken>(
  "NotificationToken",
  NotificationTokenSchema
);
