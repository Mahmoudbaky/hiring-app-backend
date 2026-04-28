import { Readable } from "stream";
import { extname, basename } from "path";
import { cloudinary } from "../lib/cloudinary.js";
import { BadRequestError } from "../utils/errors.js";

/** Extract Cloudinary public_id from a raw resource URL */
function extractPublicId(url: string): string {
  const match = url.match(/\/raw\/upload\/(?:v\d+\/)?(.+)$/);
  if (!match) throw new BadRequestError("Invalid Cloudinary URL");
  return match[1];
}

/** Return a signed URL valid for 1 hour — works regardless of account access settings */
export function signCvUrl(storedUrl: string): string {
  const publicId = extractPublicId(storedUrl);
  return cloudinary.url(publicId, {
    resource_type: "raw",
    type: "upload",
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
    secure: true,
  });
}

export async function uploadCv(buffer: Buffer, originalName: string): Promise<string> {
  const ext = extname(originalName).toLowerCase();
  const base = basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 60);
  const publicId = `${base}_${Date.now()}${ext}`;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "hiring-app/cvs",
        resource_type: "raw",
        public_id: publicId,
        access_mode: "public",
        type: "upload",
      },
      (error, result) => {
        if (error || !result) {
          return reject(error ?? new Error("Upload failed"));
        }
        resolve(result.secure_url);
      }
    );
    Readable.from(buffer).pipe(uploadStream);
  });
}
