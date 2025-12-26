/**
 * Image filter utilities for React Native Skia ColorMatrix
 */

export type FilterMatrix = number[]; // 20-element array

/**
 * Standard sepia tone filter
 * Creates warm brown/tan coloring characteristic of old photographs
 */
export const SEPIA_MATRIX: FilterMatrix = [
  0.393, 0.769, 0.189, 0, 0,
  0.349, 0.686, 0.168, 0, 0,
  0.272, 0.534, 0.131, 0, 0,
  0, 0, 0, 1, 0,
];

/**
 * Vintage/faded sepia filter
 * Sepia tone with reduced contrast and slight brightness boost
 * for an aged, faded photograph effect
 */
export const VINTAGE_SEPIA_MATRIX: FilterMatrix = [
  0.35, 0.70, 0.17, 0, 0.05,
  0.32, 0.62, 0.15, 0, 0.05,
  0.25, 0.48, 0.12, 0, 0.05,
  0, 0, 0, 1, 0,
];

/**
 * Grayscale filter (for future use)
 */
export const GRAYSCALE_MATRIX: FilterMatrix = [
  0.299, 0.587, 0.114, 0, 0,
  0.299, 0.587, 0.114, 0, 0,
  0.299, 0.587, 0.114, 0, 0,
  0, 0, 0, 1, 0,
];

/**
 * Identity matrix (no transformation)
 */
export const IDENTITY_MATRIX: FilterMatrix = [
  1, 0, 0, 0, 0,
  0, 1, 0, 0, 0,
  0, 0, 1, 0, 0,
  0, 0, 0, 1, 0,
];

/**
 * Get the appropriate filter matrix based on filter type
 */
export function getFilterMatrix(filterType: string): FilterMatrix {
  switch (filterType) {
    case 'sepia':
      return SEPIA_MATRIX;
    case 'vintage':
      return VINTAGE_SEPIA_MATRIX;
    case 'grayscale':
      return GRAYSCALE_MATRIX;
    case 'none':
    default:
      return IDENTITY_MATRIX;
  }
}

/**
 * Interpolate between two matrices based on intensity (0-1)
 * Useful for adjustable filter strength
 */
export function interpolateMatrix(
  matrixA: FilterMatrix,
  matrixB: FilterMatrix,
  intensity: number,
): FilterMatrix {
  const t = Math.max(0, Math.min(1, intensity)); // Clamp 0-1
  return matrixA.map((val, idx) => {
    return val * (1 - t) + matrixB[idx] * t;
  });
}
