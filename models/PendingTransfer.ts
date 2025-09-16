import mongoose, { Document, Schema, Types } from "mongoose";

interface IPendingTransfer extends Document {
  customer: Types.ObjectId;
  customerModel: "Tutor" | "Affiliate";
  transferCode: string;
  amount: number;
  recipientCode: string;
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
        required: [true, "Please provide transfer code"],
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
