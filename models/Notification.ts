import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  title: string;
  message: string;
  recipient: mongoose.Types.ObjectId; // User or Admin ID
  status: "read" | "unread";
  type?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a title for the notification"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Please provide a message for the notification"],
      trim: true,
    },
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
  },
  { timestamps: true }
);

export default mongoose.model<INotification>(
  "Notification",
  NotificationSchema
);
