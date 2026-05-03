import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/requireAuth.js";
import * as uploadController from "../controllers/upload.controller.js";

const DOC_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const uploadDoc = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => { cb(null, DOC_MIME_TYPES.has(file.mimetype)); },
});

const uploadImg = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => { cb(null, IMAGE_MIME_TYPES.has(file.mimetype)); },
});

const router: Router = Router();

router.post("/cv", uploadDoc.single("file"), uploadController.uploadCvFile);
router.post("/image", requireAuth, uploadImg.single("file"), uploadController.uploadImageFile);

/**
 * GET /api/upload/cv-proxy?url=<stored_cloudinary_url>
 * Fetches the CV from Cloudinary server-side (using API credentials) and
 * streams it to the authenticated client — bypasses all Cloudinary access settings.
 */
router.get("/cv-proxy", requireAuth, uploadController.proxyCv);

export default router;
