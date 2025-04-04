// import { Response } from "express";
// import { StatusCodes } from "http-status-codes";
// import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

// const s3Client = new S3Client({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
//   },
// });

// const DeleteFileFromBucket = async (
//   imageUrl: string,
//   res: Response
// ): Promise<any> => {
//   try {
//     const urlParts = new URL(imageUrl);
//     const key = urlParts.pathname.substring(1); // Extracts the key from the URL

//     const bucketName = process.env.AWS_S3_BUCKET_NAME;
//     if (!bucketName) {
//       return res.status(StatusCodes.BAD_REQUEST).json({
//         sucess: false,
//         msg: "AWS_S3_BUCKET_NAME is not defined in environment variables",
//       });
//     }

//     const params = {
//       Bucket: bucketName,
//       Key: key,
//     };

//     await s3Client.send(new DeleteObjectCommand(params));
//     console.log(`Deleted image: ${key}`);
//   } catch (error) {
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

// export default DeleteFileFromBucket;
