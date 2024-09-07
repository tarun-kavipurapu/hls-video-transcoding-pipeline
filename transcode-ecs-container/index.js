import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import fs from "fs";
import path from "path";
import express from "express";

ffmpeg.setFfmpegPath(ffmpegStatic);

const app = express();
const port = 3000;

const BUCKET_NAME = process.env.BUCKET_NAME || "temp-video-transcode"; // Fallback to default for testing
const KEY = process.env.KEY; // Fallback to default for testing
const PROD_BUCKET = process.env.PROD_BUCKET_NAME || "video-transcode-prod";

const s3Client = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: "",
    secretAccessKey: "",
  },
});
async function originalFile() {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: KEY,
    });

    const result = await s3Client.send(command);
    const originalFilePath = "original-video.mp4";
    await fs.promises.writeFile(originalFilePath, result.Body);

    return path.resolve(originalFilePath);
  } catch (err) {
    console.error(
      "Error downloading file from S3 or writing to disk:",
      err.message
    );
    throw new Error(`File download error: ${err.message}`);
  }
}

async function startTranscoder(originalVideoPath) {
  const resolutions = [
    {
      resolution: "320x180",
      videoBitrate: "500k",
      audioBitrate: "64k",
    },
    {
      resolution: "854x480",
      videoBitrate: "1000k",
      audioBitrate: "128k",
    },
    {
      resolution: "1280x720",
      videoBitrate: "2500k",
      audioBitrate: "192k",
    },
  ];

  if (!fs.existsSync("output")) {
    fs.mkdirSync("output");
  }

  const variantPlaylists = [];

  for (const { resolution, videoBitrate, audioBitrate } of resolutions) {
    const outputFileName = `${KEY.replace(".", "_")}_${resolution}.m3u8`;
    const segmentFileName = `${KEY.replace(".", "_")}_${resolution}_%03d.ts`;

    try {
      await new Promise((resolve, reject) => {
        ffmpeg(originalVideoPath)
          .outputOptions([
            `-c:v h264`,
            `-b:v ${videoBitrate}`,
            `-c:a aac`,
            `-b:a ${audioBitrate}`,
            `-vf scale=${resolution}`,
            `-f hls`,
            `-hls_time 10`,
            `-hls_list_size 0`,
            `-hls_segment_filename output/${segmentFileName}`,
          ])
          .output(`output/${outputFileName}`)
          .on("end", () => resolve())
          .on("error", (err) => {
            console.error(
              `Error processing resolution ${resolution}:`,
              err.message
            );
            reject(err);
          })
          .run();
      });

      const variantPlaylist = {
        resolution,
        outputFileName,
      };
      variantPlaylists.push(variantPlaylist);
      console.log(`HLS conversion done for ${resolution}`);
    } catch (err) {
      console.error(`Failed to transcode ${resolution}:`, err);
      throw new Error(`Transcoding error: ${err.message}`);
    }
  }

  console.log(`HLS master m3u8 playlist generating`);
  let masterPlaylist = variantPlaylists
    .map((variantPlaylist) => {
      const { resolution, outputFileName } = variantPlaylist;
      const bandwidth =
        resolution === "320x180"
          ? 676800
          : resolution === "854x480"
          ? 1353600
          : 3230400;
      return `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${resolution}\n${outputFileName}`;
    })
    .join("\n");
  masterPlaylist = `#EXTM3U\n` + masterPlaylist;

  const masterPlaylistFileName = `${KEY.replace(".", "_")}_master.m3u8`;
  const masterPlaylistPath = `output/${masterPlaylistFileName}`;
  fs.writeFileSync(masterPlaylistPath, masterPlaylist);
  console.log(`HLS master m3u8 playlist generated`);
}

async function uploadFileToS3(filePath, bucketName, key) {
  const fileStream = fs.createReadStream(filePath);
  const fileStats = fs.statSync(filePath);

  const params = {
    Bucket: bucketName,
    Key: key,
    Body: fileStream,
  };

  // Use regular PutObject for files smaller than 5MB (S3 requires multipart upload for larger files)
  if (fileStats.size < 5 * 1024 * 1024) {
    try {
      await s3Client.send(new PutObjectCommand(params));
      console.log(`Uploaded file: ${key}`);
    } catch (error) {
      console.error(`Failed to upload ${key}:`, error);
      throw error;
    }
  } else {
    await multipartUpload(filePath, bucketName, key);
  }
}

async function multipartUpload(filePath, bucketName, key) {
  const fileStream = fs.createReadStream(filePath);
  const fileSize = fs.statSync(filePath).size;

  const createUploadCommand = new CreateMultipartUploadCommand({
    Bucket: bucketName,
    Key: key,
  });

  try {
    const upload = await s3Client.send(createUploadCommand);
    const uploadId = upload.UploadId;
    const partSize = 5 * 1024 * 1024; // 5MB chunk size

    let partNumber = 1;
    let uploadedParts = [];
    let start = 0;

    while (start < fileSize) {
      const end = Math.min(start + partSize, fileSize);
      const chunk = fs.createReadStream(filePath, { start, end: end - 1 });

      const uploadPartCommand = new UploadPartCommand({
        Bucket: bucketName,
        Key: key,
        PartNumber: partNumber,
        UploadId: uploadId,
        Body: chunk,
      });

      const uploadPartResponse = await s3Client.send(uploadPartCommand);
      uploadedParts.push({
        ETag: uploadPartResponse.ETag,
        PartNumber: partNumber,
      });

      start += partSize;
      partNumber++;
    }

    const completeUploadCommand = new CompleteMultipartUploadCommand({
      Bucket: bucketName,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: uploadedParts,
      },
    });

    await s3Client.send(completeUploadCommand);
    console.log(`Multipart upload completed for ${key}`);
  } catch (error) {
    console.error(`Multipart upload failed for ${key}:`, error);
    throw error;
  }
}
async function uploadToS3() {
  const outputDir = path.resolve("output");
  const files = fs.readdirSync(outputDir);

  for (const file of files) {
    const filePath = path.join(outputDir, file);
    const fileKey = `${KEY.replace(".", "_")}/${file}`; // S3 key (destination path)
    try {
      await uploadFileToS3(filePath, PROD_BUCKET, fileKey);
    } catch (error) {
      console.error(`Failed to upload ${file}: ${error.message}`);
    }
  }
}

async function init() {
  try {
    const videoFilePath = await originalFile();
    await startTranscoder(videoFilePath);
    await uploadToS3(); // Upload after transcoding
  } catch (error) {
    console.error("Error during processing:", error.stack);
  }
}

init();
// app.get("/test-transcode");

// // Custom error handling middleware
// app.use((err, req, res, next) => {
//   console.error("Unhandled error:", err.stack);
//   res.status(500).send("Something went wrong!");
// });

// app.listen(port, () => {
//   console.log(`Server is running at http://localhost:${port}`);
// });
