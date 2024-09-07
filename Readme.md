Here’s a README documentation draft for your project involving the three microservices: Transcoder Service, Transcoder Consumer Service, and Uploader Service.

---

# Video Transcoding Microservices

This repository contains three microservices for handling video transcoding tasks using AWS services. The services include:

1. **Transcoder Service**: Handles video transcoding from S3 and generates HLS output.
2. **Transcoder Consumer Service**: Polls an SQS queue for video processing jobs and launches ECS tasks.
3. **Uploader Service**: Handles video uploads to S3 and provides a REST API for uploading video files.

## Table of Contents
- [Video Transcoding Microservices](#video-transcoding-microservices)
  - [Table of Contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
  - [Services Overview](#services-overview)
    - [1. Transcoder Service](#1-transcoder-service)
    - [2. Transcoder Consumer Service](#2-transcoder-consumer-service)
    - [3. Uploader Service](#3-uploader-service)
  - [Setup](#setup)
  - [Usage](#usage)
    - [Running Each Service](#running-each-service)
  - [Environment Variables](#environment-variables)
    - [Transcoder Service:](#transcoder-service)
    - [Transcoder Consumer Service:](#transcoder-consumer-service)
    - [Uploader Service:](#uploader-service)
  - [API Endpoints](#api-endpoints)
    - [Uploader Service:](#uploader-service-1)
  - [Deployment](#deployment)
    - [Future Enhancements](#future-enhancements)
  - [License](#license)

---

## Prerequisites

Before running the services, ensure that the following tools and libraries are installed on your local environment:

- Node.js (v16 or higher)
- AWS SDK for Node.js
- Fluent-ffmpeg and ffmpeg-static for video transcoding
- AWS account with access to S3, ECS, and SQS services
- Docker (optional, for containerization)

## Services Overview

### 1. Transcoder Service

The **Transcoder Service** is responsible for:
- Downloading the original video file from the S3 bucket.
- Using FFmpeg to convert the video into multiple HLS (HTTP Live Streaming) resolutions.
- Generating master `.m3u8` playlist and uploading the transcoded output back to the production S3 bucket.

### 2. Transcoder Consumer Service

The **Transcoder Consumer Service** polls an SQS queue for messages that contain information about new video uploads. It:
- Reads messages from the SQS queue.
- Parses the video upload event and launches ECS tasks for video transcoding.
- Deletes the processed message from the SQS queue.

### 3. Uploader Service

The **Uploader Service** provides a simple API to upload videos to the S3 bucket:
- Accepts video files through HTTP requests.
- Uploads the files to S3.
- Includes a health check endpoint to monitor service health.

## Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-repo/video-transcoding-microservices.git
   cd video-transcoding-microservices
   ```

2. **Install dependencies** for each service:
   - Navigate to the respective directories (`transcoder-service/`, `consumer-service/`, `uploader-service/`) and run:
     ```bash
     npm install
     ```

3. **Set up AWS Credentials**:
   Ensure that your AWS credentials are configured in `~/.aws/credentials` or provide them in the environment variables (see [Environment Variables](#environment-variables)).

4. **Configure the environment variables** for each service (see the [Environment Variables](#environment-variables) section).

## Usage

### Running Each Service

1. **Transcoder Service**:
   ```bash
   cd transcoder-service
   npm start
   ```

2. **Transcoder Consumer Service**:
   ```bash
   cd consumer-service
   npm start
   ```

3. **Uploader Service**:
   ```bash
   cd uploader-service
   npm start
   ```

Each service can be run individually or orchestrated with Docker if needed.

## Environment Variables

Each service requires specific environment variables to be set. Below is the list of required environment variables for each service.

### Transcoder Service:
| Variable      | Description                                        |
| ------------- | -------------------------------------------------- |
| `BUCKET_NAME` | Name of the S3 bucket where the video is uploaded  |
| `KEY`         | S3 object key (video file path)                    |
| `PROD_BUCKET` | Production bucket where transcoded files are saved |

### Transcoder Consumer Service:
| Variable                | Description                                          |
| ----------------------- | ---------------------------------------------------- |
| `AWS_ACCESS_KEY_ID`     | AWS Access Key ID                                    |
| `AWS_SECRET_ACCESS_KEY` | AWS Secret Access Key                                |
| `QUEUE_URL`             | SQS queue URL to poll messages from                  |
| `CLUSTER_ARN`           | ARN of the ECS cluster for running transcoding tasks |
| `TASK_DEFINITION_ARN`   | ARN of the ECS task definition for transcoding       |

### Uploader Service:
| Variable                | Description                                |
| ----------------------- | ------------------------------------------ |
| `AWS_ACCESS_KEY_ID`     | AWS Access Key ID                          |
| `AWS_SECRET_ACCESS_KEY` | AWS Secret Access Key                      |
| `BUCKET_NAME`           | S3 bucket name for storing uploaded videos |

## API Endpoints

### Uploader Service:

1. **Upload Video**
   - **Endpoint**: `POST /upload`
   - **Description**: Uploads a video file to the S3 bucket.
   - **Request**: 
     - Form Data: `file` (The video file to be uploaded)
   - **Response**: 
     - Status `200`: Success message with the uploaded file details.
     - Status `400`: Error message if no file is uploaded.

2. **Health Check**
   - **Endpoint**: `GET /test`
   - **Description**: A simple health check endpoint to ensure the service is running.
   - **Response**: Status `200` with a success message.

## Deployment

You can deploy these services individually or as a whole system. For example, using Docker:

1. **Build Docker Images**:
   ```bash
   docker build -t transcoder-service ./transcoder-service
   docker build -t consumer-service ./consumer-service
   docker build -t uploader-service ./uploader-service
   ```

2. **Run Docker Containers**:
   ```bash
   docker run -p 3000:3000 transcoder-service
   docker run consumer-service
   docker run -p 3001:3001 uploader-service
   ```

3. **Deploy to ECS**:
   Create ECS task definitions and services for each microservice.

---

### Future Enhancements

- Add retry logic for failed ECS task launches.
- Implement better error handling and logging.
- Add support for more video formats and resolution options.

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Feel free to modify this README to suit your project better. Let me know if you need any changes!#   h l s - v i d e o - t r a n s c o d i n g - p i p e l i n e  
 #   h l s - v i d e o - t r a n s c o d i n g - p i p e l i n e  
 