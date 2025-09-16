import mongoose, { Document, Schema, Types } from "mongoose";
import { hashAccountNumber, encrypt, decrypt } from "../utils/index.js";

interface IBankPaymentMethod extends Document {
  customer: Types.ObjectId;
  customerModel: "Tutor" | "Affiliate";
  type: "bank" | "card";
  recipientCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  accountHash: string;
  isDefault: boolean;

  decryptAccountNumber(): string;
  decryptAccountName(): string;
}

const BankPaymentMethodSchema: Schema<IBankPaymentMethod> =
  new Schema<IBankPaymentMethod>(
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
      type: {
        type: String,
        required: [true, "please provider verification type"],
      },
      recipientCode: {
        type: String,
        required: [true, "please provider recipient code"],
      },
      bankName: {
        type: String,
        required: [true, "Please provider bank name"],
      },
      accountNumber: {
        type: String,
        required: [true, "Please provide account number"],
        set: (val: string) => (val ? encrypt(val) : val),
      },
      accountName: {
        type: String,
        required: [true, "Please provide account name"],
        set: (val: string) => (val ? encrypt(val) : val),
      },
      accountHash: {
        type: String,
        required: true,
        default: function () {
          const decrypted = decrypt(this.accountNumber);
          return hashAccountNumber(decrypted);
        },
        index: true, // allow fast lookup
      },
      isDefault: {
        type: Boolean,
        default: false,
      },
    },
    { timestamps: true }
  );

// Middleware: auto-generate hash from plain account number
BankPaymentMethodSchema.pre("save", function (next) {
  if (this.isModified("accountNumber")) {
    const decrypted = decrypt(this.accountNumber);
    this.accountHash = hashAccountNumber(decrypted);
  }
  next();
});

// Custom methods for decrypting
BankPaymentMethodSchema.methods.decryptAccountNumber = function () {
  return decrypt(this.accountNumber);
};
BankPaymentMethodSchema.methods.decryptAccountName = function () {
  return decrypt(this.accountName);
};

export default mongoose.model<IBankPaymentMethod>(
  "BankPaymentMethod",
  BankPaymentMethodSchema
);
