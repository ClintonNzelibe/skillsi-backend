import { v2 as cloudinary } from "cloudinary";
import { StatusCodes } from "http-status-codes";
// Configure Cloudinary
cloudinary.config({
    cloud_name: "dhlhdrh3i",
    api_key: "968815683176817",
    api_secret: "iQ8xtqZrgPR-mgbAmY5lSPvSjeM",
});
const UploadFileToCloudinary = async (fileData, options = {}, res) => {
    try {
        if (!fileData) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "No file data provided",
            });
        }
        let buffer;
        let mimeType = options.fileType || "";
        if (typeof fileData === "string") {
            const match = fileData.match(/^data:(.+);base64,/);
            if (match && match[1]) {
                mimeType = match[1];
                fileData = fileData.replace(/^data:.+;base64,/, "");
            }
            buffer = Buffer.from(fileData, "base64");
        }
        else {
            buffer = fileData;
        }
        // Validate type
        if (options.allowedFileTypes?.length && mimeType) {
            if (!options.allowedFileTypes.includes(mimeType)) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: `Invalid file type. Allowed: ${options.allowedFileTypes.join(", ")}`,
                });
            }
        }
        // Validate size
        if (options.maxSizeInMB) {
            const maxBytes = options.maxSizeInMB * 1024 * 1024;
            if (buffer.length > maxBytes) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: `File size exceeds limit of ${options.maxSizeInMB}MB`,
                });
            }
        }
        // Use timestamp as public_id if fileName is not provided
        const publicId = options.fileName || `file-${Date.now()}`;
        // Upload to Cloudinary
        const base64Str = `data:${mimeType};base64,${buffer.toString("base64")}`;
        const uploadResult = await cloudinary.uploader.upload(base64Str, {
            folder: options.folder,
            public_id: publicId,
            resource_type: "auto",
        });
        return uploadResult.secure_url;
    }
    catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Cloudinary upload failed",
            error: error?.message || "Unknown error",
        });
    }
};
export default UploadFileToCloudinary;
// // Helper function to get file extension from MIME type
// const getFileExtension = (mimeType: string): string => {
//   const extensions: { [key: string]: string } = {
//     "application/pdf": ".pdf",
//     "image/png": ".png",
//     "image/jpeg": ".jpg",
//     "image/jpg": ".jpg",
//   };
//   return extensions[mimeType] || "";
// };
// export default UploadFileToBucket;
