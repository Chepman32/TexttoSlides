import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import StorageInitializer from '../utils/storageInit';
import {
  DEFAULT_SLIDE_FONT_ID,
  getSlideFontByFamily,
  getSlideFontById,
  resolveFontFamilyForPlatform,
  SlideFontId,
  LEGACY_SYSTEM_FONT_ID,
} from '../constants/fonts';
import type { TextEffectInstance } from '../constants/textEffects';
import { isTextEffectSupported } from '../constants/textEffects';
import type { CompositionState } from '../types/composer';

const platformKey: 'ios' | 'android' | 'default' =
  Platform.OS === 'ios'
    ? 'ios'
    : Platform.OS === 'android'
    ? 'android'
    : 'default';

export interface ProjectState {
  id: string;
  text: string;
  slides: Array<{
    id: number;
    text: string;
    image: string;
    position: { x: number; y: number };
    fontSize: number;
    color: string;
    backgroundColor: string;
    textAlign: 'left' | 'center' | 'right';
    fontWeight: 'normal' | 'bold';
    fontFamily?: string;
    fontId?: SlideFontId;
    textEffects?: TextEffectInstance[];
  }>;
  images: string[];
  thumbnail?: string; // Thumbnail image URI for preview
  composition?: CompositionState; // Full composition state
  lastModified: string;
  isCompleted: boolean;
}

export interface AppState {
  currentProject?: ProjectState;
  recentProjects: ProjectState[];
  preferences: {
    theme: string;
    language: string;
    soundEnabled: boolean;
    hapticsEnabled: boolean;
  };
}

const sanitizeTextEffects = (
  effects?: TextEffectInstance[],
): TextEffectInstance[] =>
  (effects ?? []).filter(effect => isTextEffectSupported(effect.type));

class StorageService {
  private static instance: StorageService;
  private readonly STORAGE_KEYS = {
    CURRENT_PROJECT: '@Snapduo:currentProject',
    RECENT_PROJECTS: '@Snapduo:recentProjects',
    PREFERENCES: '@Snapduo:preferences',
    APP_STATE: '@Snapduo:appState',
    PRO_STATUS: '@Snapduo:proStatus',
    FIRST_LAUNCH: '@Snapduo:firstLaunch',
  };

  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
      // Initialize storage on first getInstance
      StorageInitializer.initialize().catch(error => {
        console.log('Storage initialization in background:', error);
      });
    }
    return StorageService.instance;
  }

  // Save current project state
  async saveCurrentProject(project: ProjectState): Promise<void> {
    return StorageInitializer.safeStorageOperation(
      async () => {
        const normalizedProject: ProjectState = {
          ...project,
          lastModified: new Date().toISOString(),
          slides: project.slides.map(slide => ({
            ...slide,
            textEffects: sanitizeTextEffects(slide.textEffects),
          })),
        };
        await AsyncStorage.setItem(
          this.STORAGE_KEYS.CURRENT_PROJECT,
          JSON.stringify(normalizedProject),
        );

        // Also add to recent projects
        await this.addToRecentProjects(normalizedProject);
      },
      undefined,
      'saveCurrentProject',
    );
  }

  // Load current project state
  async loadCurrentProject(): Promise<ProjectState | null> {
    return StorageInitializer.safeStorageOperation(
      async () => {
        const projectData = await AsyncStorage.getItem(
          this.STORAGE_KEYS.CURRENT_PROJECT,
        );
        if (projectData) {
          const parsed: ProjectState = JSON.parse(projectData);

          if (parsed?.slides?.length) {
            parsed.slides = parsed.slides.map(slide => {
              const legacyFontId =
                slide.fontId === LEGACY_SYSTEM_FONT_ID
                  ? DEFAULT_SLIDE_FONT_ID
                  : slide.fontId;
              const fontOption = legacyFontId
                ? getSlideFontById(legacyFontId)
                : getSlideFontByFamily(slide.fontFamily);

              return {
                ...slide,
                fontId:
                  legacyFontId ??
                  (slide.fontFamily
                    ? getSlideFontByFamily(slide.fontFamily).id
                    : DEFAULT_SLIDE_FONT_ID),
                fontFamily: resolveFontFamilyForPlatform(
                  fontOption,
                  platformKey,
                ),
                textEffects: sanitizeTextEffects(slide.textEffects),
              };
            });
          }

          return parsed;
        }
        return null;
      },
      null,
      'loadCurrentProject',
    );
  }

  // Clear current project
  async clearCurrentProject(): Promise<void> {
    return StorageInitializer.safeStorageOperation(
      async () => {
        await AsyncStorage.removeItem(this.STORAGE_KEYS.CURRENT_PROJECT);
      },
      undefined,
      'clearCurrentProject',
    );
  }

  // Add project to recent projects
  private async addToRecentProjects(project: ProjectState): Promise<void> {
    try {
      const recentProjects = await this.getRecentProjects();

      // Remove if already exists
      const filteredProjects = recentProjects.filter(p => p.id !== project.id);

      // Add to beginning
      filteredProjects.unshift(project);

      // Keep only last 10 projects
      const trimmedProjects = filteredProjects.slice(0, 10);

      await AsyncStorage.setItem(
        this.STORAGE_KEYS.RECENT_PROJECTS,
        JSON.stringify(trimmedProjects),
      );
    } catch (error) {
      console.error('Error adding to recent projects:', error);
    }
  }

  // Get recent projects
  async getRecentProjects(): Promise<ProjectState[]> {
    try {
      const projectsData = await AsyncStorage.getItem(
        this.STORAGE_KEYS.RECENT_PROJECTS,
      );
      if (projectsData) {
        const parsed: ProjectState[] = JSON.parse(projectsData);

        // Helper to check if a string is a valid image URI
        const isValidUri = (uri: string | undefined | null): boolean => {
          if (!uri || typeof uri !== 'string') return false;
          const trimmed = uri.trim();
          if (trimmed.length === 0) return false;
          // Must start with a valid protocol or path
          return (
            trimmed.startsWith('file://') ||
            trimmed.startsWith('ph://') ||
            trimmed.startsWith('content://') ||
            trimmed.startsWith('http://') ||
            trimmed.startsWith('https://') ||
            (trimmed.startsWith('/') && trimmed.length > 1)
          );
        };

        // Filter out empty projects - must have actual image content
        const validProjects = parsed.filter(project => {
          // Check for valid images in images array
          const hasValidImages =
            project.images &&
            Array.isArray(project.images) &&
            project.images.some(img => isValidUri(img));

          // Check for valid images in composition
          const hasCompositionImages =
            project.composition &&
            (isValidUri(project.composition.photoAUri) ||
              isValidUri(project.composition.photoBUri));

          // Check for valid thumbnail
          const hasThumbnail = isValidUri(project.thumbnail);

          // Must have at least one valid image source (not just thumbnail)
          const isValid = hasValidImages || hasCompositionImages;

          if (!isValid) {
            console.log('Filtering out invalid project:', project.id, {
              images: project.images,
              photoA: project.composition?.photoAUri,
              photoB: project.composition?.photoBUri,
            });
          }

          return isValid;
        });

        // If we filtered some out, save the cleaned list
        if (validProjects.length !== parsed.length) {
          await AsyncStorage.setItem(
            this.STORAGE_KEYS.RECENT_PROJECTS,
            JSON.stringify(validProjects),
          );
        }

        return validProjects.map(project => ({
          ...project,
          slides:
            project.slides?.map(slide => {
              const legacyFontId =
                slide.fontId === LEGACY_SYSTEM_FONT_ID
                  ? DEFAULT_SLIDE_FONT_ID
                  : slide.fontId;
              const fontOption = legacyFontId
                ? getSlideFontById(legacyFontId)
                : getSlideFontByFamily(slide.fontFamily);

              return {
                ...slide,
                fontId:
                  legacyFontId ??
                  (slide.fontFamily
                    ? getSlideFontByFamily(slide.fontFamily).id
                    : DEFAULT_SLIDE_FONT_ID),
                fontFamily: resolveFontFamilyForPlatform(
                  fontOption,
                  platformKey,
                ),
                textEffects: sanitizeTextEffects(slide.textEffects),
              };
            }) || [],
        }));
      }
      return [];
    } catch (error) {
      console.error('Error getting recent projects:', error);
      return [];
    }
  }

  // Delete a recent project
  async deleteRecentProject(projectId: string): Promise<void> {
    try {
      const recentProjects = await this.getRecentProjects();
      const filteredProjects = recentProjects.filter(p => p.id !== projectId);

      await AsyncStorage.setItem(
        this.STORAGE_KEYS.RECENT_PROJECTS,
        JSON.stringify(filteredProjects),
      );
    } catch (error) {
      console.error('Error deleting recent project:', error);
    }
  }

  // Force cleanup of all empty/invalid projects from storage
  async cleanupEmptyProjects(): Promise<number> {
    try {
      const projectsData = await AsyncStorage.getItem(
        this.STORAGE_KEYS.RECENT_PROJECTS,
      );
      if (!projectsData) return 0;

      const parsed: ProjectState[] = JSON.parse(projectsData);
      const originalCount = parsed.length;

      // Helper to check if a string is a valid image URI
      const isValidUri = (uri: string | undefined | null): boolean => {
        if (!uri || typeof uri !== 'string') return false;
        const trimmed = uri.trim();
        return (
          trimmed.length > 0 &&
          (trimmed.startsWith('file://') ||
            trimmed.startsWith('ph://') ||
            trimmed.startsWith('content://') ||
            trimmed.startsWith('http://') ||
            trimmed.startsWith('https://') ||
            trimmed.startsWith('/'))
        );
      };

      const validProjects = parsed.filter(project => {
        // Must have a valid thumbnail to be kept
        const hasValidThumbnail = isValidUri(project.thumbnail);
        if (!hasValidThumbnail) return false;

        const hasValidImages =
          project.images &&
          Array.isArray(project.images) &&
          project.images.some(img => isValidUri(img));

        const hasCompositionImages =
          project.composition &&
          (isValidUri(project.composition.photoAUri) ||
            isValidUri(project.composition.photoBUri));

        return hasValidImages || hasCompositionImages;
      });

      const removedCount = originalCount - validProjects.length;

      if (removedCount > 0) {
        await AsyncStorage.setItem(
          this.STORAGE_KEYS.RECENT_PROJECTS,
          JSON.stringify(validProjects),
        );
      }

      return removedCount;
    } catch (error) {
      console.error('Error cleaning up empty projects:', error);
      return 0;
    }
  }

  // Clear all recent projects (for debugging/reset)
  async clearAllRecentProjects(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEYS.RECENT_PROJECTS);
      console.log('All recent projects cleared');
    } catch (error) {
      console.error('Error clearing recent projects:', error);
    }
  }

  // Save preferences
  async savePreferences(
    preferences: Partial<AppState['preferences']>,
  ): Promise<void> {
    try {
      const currentPrefs = await this.getPreferences();
      const updatedPrefs = { ...currentPrefs, ...preferences };

      await AsyncStorage.setItem(
        this.STORAGE_KEYS.PREFERENCES,
        JSON.stringify(updatedPrefs),
      );
    } catch (error) {
      console.error('Error saving preferences:', error);
      throw error;
    }
  }

  // Get preferences
  async getPreferences(): Promise<AppState['preferences']> {
    try {
      const prefsData = await AsyncStorage.getItem(
        this.STORAGE_KEYS.PREFERENCES,
      );
      if (prefsData) {
        return JSON.parse(prefsData);
      }

      // Return defaults with device language
      const { getDeviceLanguage } = require('../utils/deviceLanguage');
      const deviceLang = getDeviceLanguage();
      return {
        theme: 'light',
        language: deviceLang,
        soundEnabled: true,
        hapticsEnabled: true,
      };
    } catch (error) {
      console.error('Error getting preferences:', error);
      // Return defaults on error
      return {
        theme: 'light',
        language: 'en',
        soundEnabled: true,
        hapticsEnabled: true,
      };
    }
  }

  // Save entire app state
  async saveAppState(state: AppState): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.APP_STATE,
        JSON.stringify(state),
      );
    } catch (error) {
      console.error('Error saving app state:', error);
      throw error;
    }
  }

  // Load entire app state
  async loadAppState(): Promise<AppState | null> {
    try {
      const stateData = await AsyncStorage.getItem(this.STORAGE_KEYS.APP_STATE);
      if (stateData) {
        return JSON.parse(stateData);
      }
      return null;
    } catch (error) {
      console.error('Error loading app state:', error);
      return null;
    }
  }

  // Check if first launch
  async isFirstLaunch(): Promise<boolean> {
    return StorageInitializer.safeStorageOperation(
      async () => {
        const firstLaunch = await AsyncStorage.getItem(
          this.STORAGE_KEYS.FIRST_LAUNCH,
        );
        if (firstLaunch === null) {
          // Try to set the first launch flag
          await AsyncStorage.setItem(this.STORAGE_KEYS.FIRST_LAUNCH, 'false');
          return true;
        }
        return false;
      },
      false,
      'isFirstLaunch',
    );
  }

  // Clear all storage
  async clearAllStorage(): Promise<void> {
    try {
      const keys = Object.values(this.STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Error clearing all storage:', error);
      throw error;
    }
  }

  // Get storage info
  async getStorageInfo(): Promise<{ totalSize: number; keys: string[] }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;

      // Calculate total size (rough estimate)
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }

      return { totalSize, keys };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return { totalSize: 0, keys: [] };
    }
  }

  // Auto-save functionality
  private autoSaveTimer: NodeJS.Timeout | null = null;

  startAutoSave(project: ProjectState, intervalMs: number = 30000): void {
    this.stopAutoSave();

    this.autoSaveTimer = setInterval(async () => {
      try {
        await this.saveCurrentProject(project);
        console.log('Auto-save completed');
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, intervalMs);
  }

  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  // Export/Import functionality for backup
  async exportData(): Promise<string> {
    try {
      const appState = await this.loadAppState();
      const recentProjects = await this.getRecentProjects();
      const preferences = await this.getPreferences();

      const exportData = {
        appState,
        recentProjects,
        preferences,
        exportDate: new Date().toISOString(),
        version: '1.0.0',
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);

      if (data.appState) {
        await this.saveAppState(data.appState);
      }

      if (data.recentProjects) {
        await AsyncStorage.setItem(
          this.STORAGE_KEYS.RECENT_PROJECTS,
          JSON.stringify(data.recentProjects),
        );
      }

      if (data.preferences) {
        await this.savePreferences(data.preferences);
      }

      console.log('Data imported successfully');
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }
}

export default StorageService.getInstance();
