import mongoose, { Schema, Document } from "mongoose";

interface INotificationToken extends Document {
  user: mongoose.Types.ObjectId; // Reference to User
  token: string; // Device token
  deviceType?: "android" | "ios" | "web"; // Optional device type

  createdAt: Date;
  updatedAt: Date;
}

const NotificationTokenSchema: Schema<INotificationToken> = new mongoose.Schema(
  {
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
