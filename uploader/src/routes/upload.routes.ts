import { Router } from "express";

import { upload } from "../middlewares/multer.middlewares";
import { uploadVideo } from "../controllers/upload.controllers";
import { healthCheck } from "../controllers/upload.controllers";
const router = Router();

router.route("/upload").post(upload.single("file"), uploadVideo);
router.route("/test").get(healthCheck);

export default router;
