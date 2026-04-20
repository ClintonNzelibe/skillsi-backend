// models/WishList.ts
import mongoose, { Schema } from "mongoose";
const WishListSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Assuming there's a Course model
        required: true,
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course", // Assuming there's a Course model
        required: true,
    },
}, { timestamps: true });
// Prevent duplicate user-course combination
WishListSchema.index({ user: 1, course: 1 }, { unique: true });
export default mongoose.model("WishList", WishListSchema);
