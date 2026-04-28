import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/requireAuth.js";
import * as uploadController from "../controllers/upload.controller.js";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, ALLOWED_MIME_TYPES.has(file.mimetype));
  },
});

const router: Router = Router();

router.post("/cv", upload.single("file"), uploadController.uploadCvFile);

/**
 * GET /api/upload/cv-proxy?url=<stored_cloudinary_url>
 * Fetches the CV from Cloudinary server-side (using API credentials) and
 * streams it to the authenticated client — bypasses all Cloudinary access settings.
 */
router.get("/cv-proxy", requireAuth, uploadController.proxyCv);

export default router;
