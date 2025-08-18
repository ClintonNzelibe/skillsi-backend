import mongoose, { Document, Schema } from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";

export interface IAdmin extends Document {
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  password: string;
  role: "superadmin" | "admin";

  comparePassword(candidatePassword: string): Promise<boolean>;
}

const AdminSchema = new Schema<IAdmin>(
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
      required: [true, "Please provide user name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please provide email address"],
      unique: true,
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
    role: {
      type: String,
      enum: ["superadmin", "admin"],
      default: "admin",
    },
  },
  { timestamps: true }
);

// Hash password before saving
AdminSchema.pre<IAdmin>("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password!, salt);
  next();
});

// Compare password method
AdminSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  if (!this.password) {
    return false;
  }
  const isMatch = await bcrypt.compare(candidatePassword, this.password!);
  return isMatch;
};

// Prevent role change if superadmin
AdminSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate() as any;
  if (!update) return next();

  // Check if role is being changed
  if (update.role) {
    const docToUpdate = await this.model.findOne(this.getQuery());
    if (docToUpdate?.role === "superadmin" && update.role !== "superadmin") {
      return next(new Error("Cannot change role of a superadmin"));
    }
  }
  next();
});

// Also check for save() updates (manual doc.save calls)
AdminSchema.pre("save", function (next) {
  if (!this.isModified("role")) return next();
  if (this.get("role") !== "superadmin") return next();

  // Prevent changing from superadmin in save() calls
  if ((this as any)._originalRole === "superadmin" && this.get("role") !== "superadmin") {
    return next(new Error("Cannot change role of a superadmin"));
  }
  next();
});

export default mongoose.model<IAdmin>("Admin", AdminSchema);
