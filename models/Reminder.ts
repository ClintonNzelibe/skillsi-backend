import mongoose, { Schema, Document } from "mongoose";

export interface IReminder extends Document {
  userId: mongoose.Types.ObjectId;
  frequency: {
    day: string | number;
    time: string; // 24-hour format
  }[];
  active: boolean;
  lastSent: Date | null;
}

const ReminderSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please provider user id"],
    },

    frequency: [
      {
        day: {
          type: Schema.Types.Mixed, // can be string or number
          enum: [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            0,
            1,
            2,
            3,
            4,
            5,
            6,
          ],
          required: [true, "Please provide day"],
        },
        time: {
          hour: { type: Number, required: true },
          minute: { type: Number, default: 0 },
        },
      },
    ],

    active: { type: Boolean, default: true },
    lastSent: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model<IReminder>("Reminder", ReminderSchema);
