import mongoose, { Schema } from "mongoose";
const CategorySchema = new Schema({
    name: {
        type: String,
        required: [true, "Please provide category name"],
        // unique: true, // ensures no duplicates
        trim: true,
        lowercase: true, // keeps stored name consistent
    },
    description: {
        type: String,
        trim: true,
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin", // assuming User is the model for admin users
        required: [true, "Admin is required for category creation"],
    },
}, { timestamps: true });
// Optional: Create an index to enforce uniqueness at the database level
// Create a unique index with case-insensitive and whitespace-insensitive behavior
CategorySchema.index({ name: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });
export default mongoose.model("Category", CategorySchema);
