/**
 * Utility functions for image handling in the Text-to-Slides app
 */

/**
 * Generate a placeholder image URL
 * @param width Width of the image
 * @param height Height of the image
 * @param text Optional text to display on the image
 * @returns Placeholder image URL
 */
export const generatePlaceholderImage = (width: number, height: number, text?: string): string => {
  if (text) {
    return `https://placehold.co/${width}x${height}?text=${encodeURIComponent(text)}`;
  }
  return `https://placehold.co/${width}x${height}`;
};

/**
 * Validate if a string is a valid image URL
 * @param url The URL to validate
 * @returns True if valid image URL, false otherwise
 */
export const isValidImageUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
  const lowerUrl = url.toLowerCase();
  
  // Check if URL ends with common image extensions
  return imageExtensions.some(ext => lowerUrl.endsWith(ext));
};

/**
 * Get image dimensions from URL (mock implementation)
 * @param _url Image URL
 * @returns Promise with width and height
 */
export const getImageDimensions = async (_url: string): Promise<{ width: number; height: number }> => {
  // In a real implementation, we would use a library like react-native-image-size
  // For now, we'll return a default size
  return { width: 1080, height: 1080 };
};

/**
 * Resize image dimensions while maintaining aspect ratio
 * @param originalWidth Original width
 * @param originalHeight Original height
 * @param maxWidth Maximum width
 * @param maxHeight Maximum height
 * @returns Resized dimensions
 */
export const resizeImageDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } => {
  const aspectRatio = originalWidth / originalHeight;
  
  if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
    return { width: originalWidth, height: originalHeight };
  }
  
  if (aspectRatio > 1) {
    // Landscape image
    const newWidth = Math.min(originalWidth, maxWidth);
    return { width: newWidth, height: newWidth / aspectRatio };
  } else {
    // Portrait or square image
    const newHeight = Math.min(originalHeight, maxHeight);
    return { width: newHeight * aspectRatio, height: newHeight };
  }
};

export default {
  generatePlaceholderImage,
  isValidImageUrl,
  getImageDimensions,
  resizeImageDimensions,
};