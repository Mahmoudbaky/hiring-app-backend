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

/**
 * @swagger
 * /api/upload/cv:
 *   post:
 *     summary: Upload a CV file (PDF or Word) to Cloudinary
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Returns the Cloudinary URL
 */
router.post("/cv", upload.single("file"), uploadController.uploadCvFile);
router.get("/cv-signed-url", requireAuth, uploadController.getSignedCvUrl);

export default router;
