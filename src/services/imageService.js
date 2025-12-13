import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import process from "process"; // Ensure process is defined
import { logger } from "../utils/logger.js";
import AppError  from "../utils/appError.js";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "/app/uploads";

/**
 * Compresses and saves an image.
 * @param {string} inputPath - Path to the uploaded file on disk
 * @returns {Promise<string>} - Relative path to the saved image (WebP)
 */
export async function processAndSaveImage(inputPath) {
  try {
    // If inputPath is not a string, it might be a buffer (if legacy), but we expect path now.
    // We will process the file at inputPath, convert to WebP, and save it.

    // Create new filename: same basename but .webp
    const dir = path.dirname(inputPath);
    const ext = path.extname(inputPath);
    const basename = path.basename(inputPath, ext); // filename without ext

    const newFileName = `${basename}.webp`;
    const newFilePath = path.join(dir, newFileName);

    await sharp(inputPath)
      .resize(800, 800, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toFile(newFilePath);

    logger.info(`Image processed and saved: ${newFilePath}`);

    // Delete the original uncompressed file
    try {
      await fs.unlink(inputPath);
    } catch (err) {
      logger.warn(`Failed to delete original file ${inputPath}:`, err);
    }

    const relativePath = path.relative(UPLOAD_DIR, newFilePath);

    return relativePath.replace(/\\/g, "/");
  } catch (error) {
    logger.error("Image processing error:", error);
    throw new AppError("Failed to process image", 500);
  }
}

/**
 * Deletes an image file.
 * @param {string} relativePath
 */
export async function deleteImage(relativePath) {
  try {
    if (!relativePath) return;
    const fullPath = path.join(UPLOAD_DIR, relativePath);
    await fs.unlink(fullPath);
    logger.info(`Image deleted: ${fullPath}`);
  } catch (error) {
    logger.warn(`Failed to delete image ${relativePath}:`, error);
  }
}
