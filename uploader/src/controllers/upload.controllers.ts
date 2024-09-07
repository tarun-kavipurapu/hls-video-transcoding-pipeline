// src/controllers/uploadController.ts

import { Request, Response } from "express";
import { uploadToS3 } from "../utils/S3client";
import { ApiResponse } from "../utils/ApiResponse";
import ApiError from "../utils/ApiError";

export const healthCheck = async (req: Request, res: Response) => {
  res.status(200).json(new ApiResponse(200, null, "Test Health check"));
};

// Controller function to handle file upload
export const uploadVideo = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      throw new ApiError(400, "No file uploaded!");
    }

    const upload = await uploadToS3(req.file as Express.Multer.File);
    res
      .status(200)
      .send(new ApiResponse(200, upload, "File uploaded successfully"));
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).send({ message: error.message });
    } else {
      res.status(500).send({ message: "Internal Server Error" });
    }
  }
};
