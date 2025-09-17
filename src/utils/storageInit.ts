/**
 * Storage Initialization Utility
 * Ensures AsyncStorage is properly initialized before use
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

class StorageInitializer {
  private static instance: StorageInitializer;
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): StorageInitializer {
    if (!StorageInitializer.instance) {
      StorageInitializer.instance = new StorageInitializer();
    }
    return StorageInitializer.instance;
  }

  /**
   * Initialize AsyncStorage by attempting to write and read a test value
   * This ensures the directory structure is created
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.performInitialization();
    return this.initPromise;
  }

  private async performInitialization(): Promise<void> {
    const testKey = '@TextToSlides:init_test';
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        // Try to write a test value
        await AsyncStorage.setItem(testKey, 'initialized');

        // Try to read it back
        const value = await AsyncStorage.getItem(testKey);

        if (value === 'initialized') {
          // Clean up the test value
          await AsyncStorage.removeItem(testKey);
          this.isInitialized = true;
          console.log('AsyncStorage initialized successfully');
          return;
        }
      } catch (error) {
        retryCount++;
        console.log(`AsyncStorage initialization attempt ${retryCount} failed:`, error);

        if (retryCount < maxRetries) {
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }

    // Even if initialization fails, mark as initialized to prevent blocking
    this.isInitialized = true;
    console.warn('AsyncStorage initialization completed with warnings');
  }

  /**
   * Check if storage is initialized
   */
  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Safe storage operation wrapper
   */
  async safeStorageOperation<T>(
    operation: () => Promise<T>,
    fallback: T,
    operationName: string = 'storage operation'
  ): Promise<T> {
    try {
      // Ensure initialization
      await this.initialize();

      // Perform the operation
      return await operation();
    } catch (error) {
      console.warn(`Safe storage operation failed for ${operationName}:`, error);
      return fallback;
    }
  }

  /**
   * Clear all storage (for debugging)
   */
  async clearAll(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      if (keys.length > 0) {
        await AsyncStorage.multiRemove(keys);
      }
      console.log('Storage cleared successfully');
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  /**
   * Get storage info for debugging
   */
  async getStorageInfo(): Promise<{ isInitialized: boolean; keyCount: number; keys: string[] }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return {
        isInitialized: this.isInitialized,
        keyCount: keys.length,
        keys: keys.slice(0, 10) // Return first 10 keys for debugging
      };
    } catch (error) {
      return {
        isInitialized: this.isInitialized,
        keyCount: 0,
        keys: []
      };
    }
  }
}

export default StorageInitializer.getInstance();