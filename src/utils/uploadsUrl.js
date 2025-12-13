export let getUrl = (url) => {
  let cleanedUrl = url.replace(/\\/g, "/"); // Normalize all backslashes to forward slashes
  cleanedUrl = cleanedUrl.replace(/^\/?(?:app\/)?uploads\//, ""); // Remove leading /app/uploads/ or similar prefixes
  cleanedUrl = cleanedUrl.replace(/\/\/+/g, "/"); // Replace multiple slashes with a single slash
  return cleanedUrl;
};

/**
 * Convert relative image path to full backend URL
 * @param {string} imagePath - Relative image path (e.g., "images/ggg.png")
 * @returns {string} Full backend URL (e.g., "http://localhost:3000/uploads/images/ggg.png")
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;

  // Get the backend URL from environment variable or use default
  const backendUrl =
    process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`;

  // Clean the image path
  const cleanedPath = getUrl(imagePath);

  // Return the full URL
  return `${backendUrl}/uploads/${cleanedPath}`;
};
