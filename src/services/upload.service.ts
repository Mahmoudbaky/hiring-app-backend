import { Readable } from "stream";
import { cloudinary } from "../lib/cloudinary.js";

export async function uploadCv(buffer: Buffer, originalName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "hiring-app/cvs",
        resource_type: "raw",
        use_filename: true,
        unique_filename: true,
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
