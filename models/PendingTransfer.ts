import mongoose, { Document, Schema, Types } from "mongoose";

interface IPendingTransfer extends Document {
  customer: Types.ObjectId;
  customerModel: "Tutor" | "Affiliate";
  transferCode?: string;
  amount: number;
  recipientCode: string;
  verificationToken: string; // store OTP
  verificationTokenExpirationDate: Date; // expiration (e.g., 10 mins)
  verificationResendAttempts: number;
  status:
    | string
    | "pending_otp"
    | "pending_approval"
    | "processing"
    | "processed"
    | "failed"
    | "reversed";
}

const PendingTransferSchema: Schema<IPendingTransfer> =
  new Schema<IPendingTransfer>(
    {
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
      transferCode: {
        type: String,
        // required: [true, "Please provide transfer code"],
        default: "",
      },
      amount: {
        type: Number,
        required: [true, "Please provide amount"],
      },
      recipientCode: {
        type: String,
        required: [true, "please provider recipient code"],
      },
      verificationToken: { type: String },
      verificationTokenExpirationDate: { type: Date },
      verificationResendAttempts: { type: Number, default: 0 },
      status: {
        type: String,
        required: [true, "Please provide transfer status"],
        default: "pending_otp",
        enum: [
          "pending_otp",
          "pending_approval",
          "processing",
          "processed",
          "failed",
          "reversed",
        ],
      },
    },
    { timestamps: true }
  );

export default mongoose.model<IPendingTransfer>(
  "PendingTransfer",
  PendingTransferSchema
);
