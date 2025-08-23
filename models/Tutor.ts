// models/Tutor.ts
import mongoose, { Schema, Document } from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";

export interface ITutor extends Document {
  fName: string;
  lName: string;
  email: string;
  password: string;
  location?: string;
  phoneNumber?: string;
  bio: string;
  expertise: string[];
  profilePicture?: string;
  certificateImage?: string;
  socialLinks?: {
    youtube?: string;
    linkedin?: string;
    xFormelyTwitter?: string;
    facebook?: string;
  };
  rating?: number;
  totalStudents?: number;
  totalReviews?: number;
  totalRevenue?: number;
  totalCourses?: number;
  numberOfEdits?: number;
  totalEnrollments?: number;
  isProfileComplete?: boolean;
  lastLoggedIn?: Date;
  loggedInTimes?: number;
  status?: "pending" | "approved" | "rejected" | "suspended";
  balance: number;
  verificationToken?: string;
  verificationTokenExpirationDate?: Date;
  verified?: Date;
  isVerified?: boolean;
  resetToken?: string;
  isResetTokenVerified: boolean;
  resetTokenExpirationDate: Date;

  comparePassword(candidatePassword: string): Promise<boolean>;
}

const TutorSchema: Schema<ITutor> = new Schema(
  {
    fName: {
      type: String,
      required: [true, "Please provide first name"],
      trim: true,
    },
    lName: {
      type: String,
      required: [true, "Please provide last name"],
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
    location: {
      type: String,
      // required: true,
      default: "",
      validate: {
        validator: (str: string) =>
          str === "" || validator.isLength(str, { min: 20 }),
        message: "Location must be at least 2 characters long",
      },
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
    bio: {
      type: String,
      // required: true,
    },
    expertise: {
      type: [String],
      // required: true,
    },
    profilePicture: {
      type: String,
      default:
        "https://res.cloudinary.com/dqj8v0x5g/image/upload/v1697060982/DefaultProfilePicture.png",
    },
    certificateImage: {
      type: String,
      default:
        "https://res.cloudinary.com/dqj8v0x5g/image/upload/v1697060982/DefaultCertificateImage.png",
    },
    socialLinks: {
      youtube: String,
      linkedin: String,
      xFormelyTwitter: String,
      facebook: String,
    },
    rating: {
      type: Number,
      default: 0,
    },
    totalStudents: {
      type: Number,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
    totalCourses: {
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

TutorSchema.pre<ITutor>("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password!, salt);
});

TutorSchema.methods.comparePassword = async function (
  canditatePassword: string
) {
  const isMatch = await bcrypt.compare(canditatePassword, this.password!);
  return isMatch;
};

export default mongoose.model<ITutor>("Tutor", TutorSchema);
