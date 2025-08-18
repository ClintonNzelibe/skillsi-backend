import mongoose, { Schema, Document } from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";

export interface IAffiliate extends Document {
  firstName: string;
  lastName: string;
  userName?: string;
  email: string;
  phoneNumber?: string;
  password: string;
  profilePicture?: string;
  numberOfEdits?: number;
  isProfileComplete?: boolean;
  lastLoggedIn?: Date;
  loggedInTimes?: number;
  status?: "pending" | "approved" | "rejected" | "suspended";
  totalRevenue?: number;
  balance: number;
  totalWithdrawals?: number;
  pendingWithdrawals?: number;
  verificationToken?: string;
  verificationTokenExpirationDate?: Date;
  verified?: Date;
  isVerified?: boolean;
  resetToken?: string;
  isResetTokenVerified: boolean;
  resetTokenExpirationDate: Date;

  comparePassword(candidatePassword: string): Promise<boolean>;
}

const AffiliateSchema: Schema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, "Please provide first name"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Please provide last name"],
      trim: true,
    },
    userName: {
      type: String,
      unique: true,
      required: [true, "Please provide a username"],
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: [true, "Please provide email address"],
      validate: {
        validator: (str: string) => validator.isEmail(str),
        message: "Please provide valid email",
      },
      trim: true,
      lowercase: true,
    },
    phoneNumber: {
      type: String,
      validate: {
        validator: (str: string) =>
          str === "" || validator.isMobilePhone(str, "any"),
        message: "Please provide a valid phone number",
      },
      trim: true,
      default: "",
    },
    password: {
      type: String,
      required: [true, "Please provide password"],
      validate: {
        validator: (str: string) => validator.isStrongPassword(str),
        message:
          "Password must be at least 12 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one symbol.",
      },
      trim: true,
      select: false,
      minlength: 12,
    },
    profilePicture: {
      type: String,
      default:
        "https://res.cloudinary.com/dqj8v0x5g/image/upload/v1697060982/DefaultProfilePicture.png",
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
    lastLoggedIn: {
      type: Date,
    },
    loggedInTimes: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "approved",
    },
    balance: {
      type: Number,
      default: 0,
    },
    numberOfEdits: { type: Number, default: 0 },
    totalEnrollments: {
      type: Number,
      default: 0,
    },
    verificationToken: { type: String },
    verificationTokenExpirationDate: { type: Date },
    verified: { type: Date, default: Date.now },
    isVerified: { type: Boolean, default: false },
    resetToken: {
      type: String,
    },
    isResetTokenVerified: {
      type: Boolean,
      default: false,
    },
    resetTokenExpirationDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

AffiliateSchema.pre<IAffiliate>("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password!, salt);
});

AffiliateSchema.methods.comparePassword = async function (
  canditatePassword: string
) {
  const isMatch = await bcrypt.compare(canditatePassword, this.password!);
  return isMatch;
};

export default mongoose.model<IAffiliate>("Affiliate", AffiliateSchema);
