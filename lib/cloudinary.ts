import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "ndlm8hwv",
  api_key: process.env.CLOUDINARY_API_KEY || "318535518357399",
  api_secret: process.env.CLOUDINARY_API_SECRET || "KjtvMp3mNoo3zHerYyt2AaqbAfc",
  secure: true,
});

export default cloudinary;
