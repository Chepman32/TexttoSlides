/**
 * Utility functions for text processing in the Text-to-Slides app
 */

/**
 * Split text into paragraphs
 * @param text The input text to split
 * @returns Array of paragraphs
 */
export const splitIntoParagraphs = (text: string): string[] => {
  return text.split('\n\n').filter(paragraph => paragraph.trim().length > 0);
};

/**
 * Split text into sentences
 * @param text The input text to split
 * @returns Array of sentences
 */
export const splitIntoSentences = (text: string): string[] => {
  // Simple sentence splitting regex
  const sentenceRegex = /[^.!?]+[.!?]+/g;
  const sentences = text.match(sentenceRegex);
  
  if (sentences) {
    return sentences.map(sentence => sentence.trim()).filter(sentence => sentence.length > 0);
  }
  
  // If no sentences found, return the original text as one item
  return [text.trim()];
};

/**
 * Split text into chunks of approximately equal length
 * @param text The input text to split
 * @param maxChars Maximum characters per chunk
 * @returns Array of text chunks
 */
export const splitIntoChunks = (text: string, maxChars: number = 200): string[] => {
  const paragraphs = splitIntoParagraphs(text);
  
  if (paragraphs.length === 0) {
    return [text];
  }
  
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed the max chars, start a new chunk
    if (currentChunk.length + paragraph.length > maxChars && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = paragraph;
    } else {
      // Otherwise, add to current chunk
      if (currentChunk.length > 0) {
        currentChunk += '\n\n';
      }
      currentChunk += paragraph;
    }
  }
  
  // Don't forget the last chunk
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
};

/**
 * Estimate the number of slides needed for a given text
 * @param text The input text
 * @param charsPerSlide Average characters per slide
 * @returns Estimated number of slides
 */
export const estimateSlideCount = (text: string, charsPerSlide: number = 200): number => {
  const cleanText = text.replace(/\s+/g, ' ').trim();
  return Math.max(1, Math.ceil(cleanText.length / charsPerSlide));
};

/**
 * Truncate text to a maximum length
 * @param text The text to truncate
 * @param maxLength Maximum length
 * @param suffix Suffix to append if truncated
 * @returns Truncated text
 */
export const truncateText = (text: string, maxLength: number, suffix: string = '...'): string => {
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength - suffix.length) + suffix;
};

export default {
  splitIntoParagraphs,
  splitIntoSentences,
  splitIntoChunks,
  estimateSlideCount,
  truncateText,
};