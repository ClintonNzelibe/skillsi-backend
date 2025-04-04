// import { Response } from "express";
// import {
//   S3Client,
//   PutObjectCommand,
//   // ObjectCannedACL,
// } from "@aws-sdk/client-s3";
// import { v4 as uuidv4 } from "uuid";
// import { StatusCodes } from "http-status-codes";

// // Configure S3 Client
// const s3Client = new S3Client({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
//   },
// });

// interface UploadOptions {
//   folder?: string;
//   allowedFileTypes?: string[];
//   maxSizeInMB?: number;
//   fileName?: string;
//   fileType?: string;
// }

// /**
//  * Uploads a file to AWS S3 and returns the public URL
//  * @param fileData - The file data as base64 string or Buffer
//  * @param options - Optional configuration for the upload
//  * @returns Promise<string> - The public URL of the uploaded file
//  */
// const UploadFileToBucket = async (
//   fileData: string | Buffer,
//   options: UploadOptions = {},
//   res: Response
// ): Promise<any> => {
//   try {
//     // Validate file presence
//     if (!fileData) {
//       return res
//         .status(StatusCodes.BAD_REQUEST)
//         .json({ success: false, msg: "No file data provided" });
//     }

//     let buffer: Buffer;
//     let mimeType = options.fileType || "";

//     // Handle base64 string
//     if (typeof fileData === "string") {
//       // Check if it's a data URL and extract MIME type if present
//       const dataUrlMatch = fileData.match(/^data:(.+);base64,/);
//       if (dataUrlMatch && dataUrlMatch[1]) {
//         // Check if match exists and has capturing group
//         mimeType = dataUrlMatch[1];
//         // Remove the data URL prefix
//         const base64Data = fileData.replace(/^data:.+;base64,/, "");
//         buffer = Buffer.from(base64Data, "base64");
//       } else {
//         // Assume it's just base64 string
//         buffer = Buffer.from(fileData, "base64");
//       }
//     } else {
//       // If it's already a Buffer, use it directly
//       buffer = fileData;
//     }

//     // Validate file type if specified
//     if (options.allowedFileTypes && options.allowedFileTypes.length > 0) {
//       if (!mimeType) {
//         return res.status(StatusCodes.BAD_REQUEST).json({
//           success: false,
//           msg: "File type (MIME type) is required when allowedFileTypes is specified",
//         });
//       }
//       if (!options.allowedFileTypes.includes(mimeType)) {
//         return res.status(StatusCodes.BAD_REQUEST).json({
//           success: false,
//           msg: `Invalid file type. Allowed types: ${options.allowedFileTypes.join(
//             ", "
//           )}`,
//         });
//       }
//     }

//     // Validate file size if specified (convert MB to bytes)
//     if (options.maxSizeInMB) {
//       const maxSizeInBytes = options.maxSizeInMB * 1024 * 1024;
//       if (buffer.length > maxSizeInBytes) {
//         return res
//           .status(StatusCodes.BAD_REQUEST)
//           .json({
//             success: false,
//             msg: `File size exceeds maximum limit of ${options.maxSizeInMB}MB`,
//           });
//       }
//     }

//     // Generate unique file name
//     const fileName =
//       options.fileName || `${uuidv4()}${getFileExtension(mimeType)}`;
//     const key = options.folder ? `${options.folder}/${fileName}` : fileName;

//     const bucketName = process.env.AWS_S3_BUCKET_NAME;
//     if (!bucketName) {
//       return res.status(StatusCodes.BAD_REQUEST).json({
//         sucess: false,
//         msg: "AWS_S3_BUCKET_NAME is not defined in environment variables",
//       });
//     }

//     // Set up upload parameters
//     const params = {
//       Bucket: bucketName,
//       Key: key,
//       Body: buffer,
//       ContentType: mimeType || "application/octet-stream",
//       // ACL: "public-read" as ObjectCannedACL,
//     };

//     // Upload to S3
//     await s3Client.send(new PutObjectCommand(params));

//     // Return the public URL
//     return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
//   } catch (error: any) {
//     if (error instanceof Error) {
//       res
//         .status(StatusCodes.INTERNAL_SERVER_ERROR)
//         .json({ success: false, msg: "Server error.", error: error.message });
//     }
//     res
//       .status(StatusCodes.INTERNAL_SERVER_ERROR)
//       .json({ success: false, msg: "Server error." });
//   }
// };

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
