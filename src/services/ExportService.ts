import {
  Canvas,
  CanvasKit,
  Skia,
  SkiaValue,
  Surface,
  Image as SkiaImage,
  Paint,
  Font,
  Rect as SkiaRect,
} from '@shopify/react-native-skia';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import ViewShot, { captureRef } from 'react-native-view-shot';
import RNFS from 'react-native-fs';
import { Alert, Platform, PermissionsAndroid, Linking } from 'react-native';
import { manipulateAsync, SaveFormat } from 'react-native-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ExportOptions {
  addWatermark: boolean;
  watermarkText?: string;
  watermarkPosition?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  quality?: number;
  format?: 'png' | 'jpg';
  resolution?: number;
}

export interface Slide {
  id: number;
  text: string;
  image: string;
  position: { x: number; y: number };
  fontSize: number;
  color: string;
  backgroundColor: string;
  textAlign: 'left' | 'center' | 'right';
  fontWeight: 'normal' | 'bold';
}

class ExportService {
  private static instance: ExportService;
  private isProUser: boolean = false;

  private constructor() {
    this.checkProStatus();
  }

  static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  private async checkProStatus() {
    try {
      const proStatus = await AsyncStorage.getItem('proStatus');
      this.isProUser = proStatus === 'true';
    } catch (error) {
      console.error('Error checking pro status:', error);
      this.isProUser = false;
    }
  }

  public setProStatus(isPro: boolean) {
    this.isProUser = isPro;
    AsyncStorage.setItem('proStatus', isPro.toString());
  }

  private async requestStoragePermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission Required',
            message: 'This app needs access to your storage to save slides',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  }

  private async measureViewSize(
    viewRef: React.RefObject<any>
  ): Promise<{ width: number; height: number } | null> {
    const view = viewRef?.current;

    if (!view || typeof view.measure !== 'function') {
      return null;
    }

    return new Promise((resolve) => {
      const resolveWith = (value: { width: number; height: number } | null) => {
        resolve(value);
      };

      setTimeout(() => {
        try {
          view.measure(
            (
              _x: number,
              _y: number,
              width: number,
              height: number
            ) => {
              if (width > 0 && height > 0) {
                resolveWith({ width, height });
                return;
              }

              if (typeof view.measureInWindow === 'function') {
                view.measureInWindow(
                  (
                    __x: number,
                    __y: number,
                    winWidth: number,
                    winHeight: number
                  ) => {
                    if (winWidth > 0 && winHeight > 0) {
                      resolveWith({ width: winWidth, height: winHeight });
                    } else {
                      resolveWith(null);
                    }
                  }
                );
              } else {
                resolveWith(null);
              }
            }
          );
        } catch (error) {
          console.warn('Unable to measure view for export:', error);
          resolveWith(null);
        }
      }, 0);
    });
  }

  private async addWatermarkToImage(
    imagePath: string,
    watermarkText: string = 'Text to Slides',
    position: string = 'bottomRight'
  ): Promise<string> {
    try {
      // Calculate watermark position
      const watermarkActions = [];

      // Add semi-transparent background for watermark
      const watermarkBackground = {
        overlay: {
          uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          position: { x: 0, y: 0 },
          opacity: 0.5,
        }
      };

      // Use image manipulation to add watermark text
      const watermarkedImage = await manipulateAsync(
        imagePath,
        [],
        {
          compress: 0.9,
          format: SaveFormat.PNG,
        }
      );

      // For now, return the original image path as we need native module for text overlay
      // In production, you would use a native module or Skia for proper text watermarking
      return watermarkedImage.uri;
    } catch (error) {
      console.error('Error adding watermark:', error);
      return imagePath;
    }
  }

  public async exportSlides(
    slides: Slide[],
    viewRefs: React.RefObject<any>[],
    options: ExportOptions = {}
  ): Promise<{ success: boolean; savedPaths: string[]; error?: string }> {
    const {
      addWatermark = !this.isProUser,
      watermarkText = 'Made with Text to Slides',
      watermarkPosition = 'bottomRight',
      quality = 0.9,
      format = 'png',
      resolution = 1080,
    } = options;

    try {
      // Request storage permission
      const hasPermission = await this.requestStoragePermission();
      if (!hasPermission) {
        return {
          success: false,
          savedPaths: [],
          error: 'Storage permission denied'
        };
      }

      const savedPaths: string[] = [];

      // Export each slide
      for (let i = 0; i < viewRefs.length; i++) {
        const viewRef = viewRefs[i];

        if (!viewRef?.current) {
          console.warn(`Slide ${i + 1} ref is null, skipping`);
          continue;
        }

        try {
          const measuredSize = await this.measureViewSize(viewRef);
          const captureOptions: Parameters<typeof captureRef>[1] = {
            format,
            result: 'tmpfile',
          };

          if (format === 'jpg') {
            captureOptions.quality = quality;
          }

          if (measuredSize && measuredSize.width > 0 && measuredSize.height > 0) {
            const aspectRatio = measuredSize.width / measuredSize.height;
            let targetWidth = measuredSize.width;
            let targetHeight = measuredSize.height;

            if (resolution && resolution > 0) {
              if (aspectRatio >= 1) {
                targetWidth = resolution;
                targetHeight = resolution / (aspectRatio || 1);
              } else {
                targetHeight = resolution;
                targetWidth = resolution * aspectRatio;
              }
            }

            captureOptions.width = Math.max(1, Math.round(targetWidth));
            captureOptions.height = Math.max(1, Math.round(targetHeight));
          }

          // Capture the view
          const uri = await captureRef(viewRef, captureOptions);

          // Add watermark if not Pro user
          let finalUri = uri;
          if (addWatermark) {
            finalUri = await this.addWatermarkToImage(uri, watermarkText, watermarkPosition);
          }

          // Save to camera roll
          const savedPath = await CameraRoll.save(finalUri, {
            type: 'photo',
            album: 'Text to Slides'
          });

          savedPaths.push(savedPath);

          // Clean up temporary file
          if (uri !== finalUri) {
            await RNFS.unlink(uri).catch(() => {});
          }
        } catch (slideError) {
          console.error(`Error exporting slide ${i + 1}:`, slideError);
        }
      }

      if (savedPaths.length === 0) {
        return {
          success: false,
          savedPaths: [],
          error: 'No slides were exported successfully'
        };
      }

      return {
        success: true,
        savedPaths
      };
    } catch (error) {
      console.error('Export error:', error);
      return {
        success: false,
        savedPaths: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  public async exportSlidesWithSkia(
    slides: Slide[],
    canvasSize: { width: number; height: number } = { width: 1080, height: 1080 }
  ): Promise<{ success: boolean; savedPaths: string[]; error?: string }> {
    const savedPaths: string[] = [];
    const addWatermark = !this.isProUser;

    try {
      for (const slide of slides) {
        // Create a surface for rendering
        const surface = Skia.Surface.MakeOffscreen(
          canvasSize.width,
          canvasSize.height
        );

        if (!surface) {
          console.error('Failed to create surface for slide');
          continue;
        }

        const canvas = surface.getCanvas();

        // Clear canvas with background color
        canvas.clear(Skia.Color('white'));

        // Draw background image if exists
        if (slide.image) {
          try {
            // Load image from URI
            const imageData = await RNFS.readFile(slide.image, 'base64');
            const image = Skia.Image.MakeImageFromEncoded(
              Skia.Data.fromBase64(imageData)
            );

            if (image) {
              const srcRect = Skia.XYWHRect(0, 0, image.width(), image.height());
              const dstRect = Skia.XYWHRect(0, 0, canvasSize.width, canvasSize.height);

              const paint = Skia.Paint();
              canvas.drawImageRect(image, srcRect, dstRect, paint);
            }
          } catch (imageError) {
            console.error('Error loading background image:', imageError);
          }
        }

        // Draw text overlay background
        const textBackgroundPaint = Skia.Paint();
        textBackgroundPaint.setColor(Skia.Color(slide.backgroundColor));

        const textBgRect = Skia.XYWHRect(
          slide.position.x,
          slide.position.y,
          canvasSize.width * 0.8,
          slide.fontSize * 2
        );
        canvas.drawRect(textBgRect, textBackgroundPaint);

        // Draw text
        const font = Skia.Font(null, slide.fontSize);
        const textPaint = Skia.Paint();
        textPaint.setColor(Skia.Color(slide.color));

        canvas.drawText(
          slide.text,
          slide.position.x + 10,
          slide.position.y + slide.fontSize,
          textPaint,
          font
        );

        // Add watermark if not Pro
        if (addWatermark) {
          const watermarkFont = Skia.Font(null, 16);
          const watermarkPaint = Skia.Paint();
          watermarkPaint.setColor(Skia.Color('rgba(0, 0, 0, 0.5)'));

          const watermarkText = 'Made with Text to Slides';
          const textBounds = watermarkFont.getTextBounds(watermarkText);

          let watermarkX = canvasSize.width - textBounds.width - 20;
          let watermarkY = canvasSize.height - 20;

          // Draw watermark background
          const watermarkBgPaint = Skia.Paint();
          watermarkBgPaint.setColor(Skia.Color('rgba(255, 255, 255, 0.7)'));

          const watermarkBgRect = Skia.XYWHRect(
            watermarkX - 5,
            watermarkY - textBounds.height - 5,
            textBounds.width + 10,
            textBounds.height + 10
          );
          canvas.drawRect(watermarkBgRect, watermarkBgPaint);

          // Draw watermark text
          canvas.drawText(
            watermarkText,
            watermarkX,
            watermarkY,
            watermarkPaint,
            watermarkFont
          );
        }

        // Save the image
        const image = surface.makeImageSnapshot();
        const data = image.encodeToBase64('png');

        // Save to temp file
        const tempPath = `${RNFS.TemporaryDirectoryPath}/slide_${slide.id}.png`;
        await RNFS.writeFile(tempPath, data, 'base64');

        // Save to camera roll
        const savedPath = await CameraRoll.save(tempPath, {
          type: 'photo',
          album: 'Text to Slides'
        });

        savedPaths.push(savedPath);

        // Clean up temp file
        await RNFS.unlink(tempPath).catch(() => {});
      }

      return {
        success: savedPaths.length > 0,
        savedPaths
      };
    } catch (error) {
      console.error('Skia export error:', error);
      return {
        success: false,
        savedPaths: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  public showExportSuccess(count: number) {
    Alert.alert(
      'Success!',
      `${count} slide${count > 1 ? 's' : ''} exported to your Photos`,
      [
        {
          text: 'View in Photos',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openURL('photos-redirect://');
            }
          }
        },
        { text: 'OK', style: 'default' }
      ]
    );
  }

  public showUpgradePrompt() {
    console.log("Upgrade prompt");
  }
}

export default ExportService.getInstance();
