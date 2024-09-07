// src/index.ts

import cookieParser from "cookie-parser";
import express, { Express } from "express";
import cors from "cors";

const app: Express = express();

import dotenv from "dotenv";
dotenv.config();

app.use(express.json());

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(express.static("public"));
app.use(
  cors({
    allowedHeaders: ["*"],
    origin: "*",
  })
);

app.get("/", (req, res) => {
  res.send("Hello, TypeScript with Node.js and Express!");
});

//routes

import uploadRouter from "./routes/upload.routes";
app.use("/api/v1/uploads", uploadRouter);

export default app;
