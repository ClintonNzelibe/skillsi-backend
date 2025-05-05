import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: "dhlhdrh3i",
  api_key: "968815683176817",
  api_secret: "iQ8xtqZrgPR-mgbAmY5lSPvSjeM",
});

const DeleteFileFromCloudinary = async (fileUrl: string) => {
  try {
    const urlParts = fileUrl.split("/");
    if (urlParts.length < 8) throw new Error("Invalid Cloudinary URL format.");

    const publicIdWithExtension = urlParts.slice(7).join("/");
    const publicId = publicIdWithExtension.split(".")[0];

    if (!publicId) throw new Error("Could not extract public ID from URL.");

    await cloudinary.uploader.destroy(publicId);
    console.log(`Deleted image: ${publicId}`);
  } catch (error: any) {
    console.error(`Error deleting image`, error);
    throw new Error(error.message);
  }
};

export default DeleteFileFromCloudinary