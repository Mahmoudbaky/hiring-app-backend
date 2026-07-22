import { Readable } from "stream";
import { extname, basename } from "path";
import { cloudinary } from "../lib/cloudinary.js";
// import { BadRequestError } from "../utils/errors.js";

// function extractPublicId(url: string): string {
//   const match = url.match(/\/raw\/upload\/(?:v\d+\/)?(.+)$/);
//   if (!match) throw new BadRequestError("Invalid Cloudinary URL");
//   return match[1];
// }

/** Fetch the CV from Cloudinary server-side and return the response to be streamed. */
// export async function fetchCvFromCloudinary(storedUrl: string) {
//   const publicId = extractPublicId(storedUrl);
//   const ext = extname(publicId).replace(".", "") || "pdf";
//   const filename = basename(publicId);

//   // SDK builds the signed download URL with correct algorithm and all required params
//   const downloadUrl = (cloudinary.utils as any).private_download_url(
//     publicId,
//     ext,
//     {
//       resource_type: "raw",
//     },
//   );

//   const response = await fetch(downloadUrl);
//   if (!response.ok) {
//     throw new Error(`Cloudinary returned ${response.status} for ${publicId}`);
//   }

//   return {
//     body: response.body,
//     contentType:
//       response.headers.get("content-type") ?? "application/octet-stream",
//     filename,
//   };
// }


const env = process.env.NODE_ENV;




export async function uploadImage(buffer: Buffer, originalName: string): Promise<string> {
  const ext = extname(originalName).toLowerCase() || ".jpg";
  const publicId = `img_${Date.now()}${ext}`;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: env === "production" ? "hiring-app-production/images" : "hiring-app/images", resource_type: "image", public_id: publicId },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Upload failed"));
        resolve(result.secure_url);
      },
    );
    Readable.from(buffer).pipe(uploadStream);
  });
}

export async function uploadCv(
  buffer: Buffer,
  originalName: string,
): Promise<string> {
  const ext = extname(originalName).toLowerCase();
  const base = basename(originalName, ext)
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 60);
  const publicId = `${base}_${Date.now()}${ext}`;


  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: env === "production" ? "hiring-app-production/cvs" : "hiring-app/cvs",
        resource_type: "raw",
        public_id: publicId,
        type: "upload",
        access_control: [{ access_type: "anonymous" }],
      },
      (error, result) => {
        if (error || !result)
          return reject(error ?? new Error("Upload failed"));
        resolve(result.secure_url);
      },
    );
    Readable.from(buffer).pipe(uploadStream);
  });
}
