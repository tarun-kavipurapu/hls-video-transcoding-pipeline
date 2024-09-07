// src/services/s3Service.ts

import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import ApiError from "../utils/ApiError";
import fs from "fs";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const uploadToS3 = async (file: Express.Multer.File): Promise<any> => {
  console.log(file);
  const fileStream = fs.createReadStream(file.path);

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: file.originalname,
    Body: fileStream,
  };

  try {
    const parallelUploads3 = new Upload({
      client: s3Client,
      params: params,
    });

    const data = await parallelUploads3.done();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new ApiError(400, error.message);
    } else {
      throw new ApiError(400, "An unknown error occurred during the upload");
    }
  }
};
