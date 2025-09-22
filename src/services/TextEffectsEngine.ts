import { Canvas, Paint, Path } from '@shopify/react-native-skia';
import type { TextEffectInstance, TextEffectType } from '../constants/textEffects';
import { TEXT_EFFECT_DEFINITIONS } from '../constants/textEffects';
import type { SlideFontId } from '../constants/fonts';

export interface EffectRenderContext {
  canvas: Canvas;
  baseTextPath: Path;
  baseFillPaint: Paint;
  baseStrokePaint: Paint;
  fontId: SlideFontId;
  fontSize: number;
  text: string;
  slideId: number;
  canvasWidth: number;
  canvasHeight: number;
}

export interface PreparedEffectLayer {
  layer: 'textFill' | 'textStroke' | 'overlay' | 'underlay' | 'background' | 'mask' | 'postprocess';
  instances: TextEffectInstance[];
}

/**
 * TextEffectsEngine orchestrates advanced rendering paths for text effects.
 *
 * The engine does not yet implement GPU programs; instead it normalizes effect
 * metadata and produces a deterministic pipeline so ExportService/preview
 * components can plug in the actual shaders incrementally.
 */
class TextEffectsEngine {
  private static instance: TextEffectsEngine;

  static getInstance(): TextEffectsEngine {
    if (!TextEffectsEngine.instance) {
      TextEffectsEngine.instance = new TextEffectsEngine();
    }
    return TextEffectsEngine.instance;
  }

  /**
   * Bucket effects by their target layer to preserve deterministic rendering order.
   */
  prepareLayers(effects: TextEffectInstance[] = []): PreparedEffectLayer[] {
    const buckets = new Map<PreparedEffectLayer['layer'], TextEffectInstance[]>();

    effects.forEach(effect => {
      const definition = TEXT_EFFECT_DEFINITIONS[effect.type];
      const layer = definition?.layer ?? 'overlay';
      if (!buckets.has(layer)) {
        buckets.set(layer, []);
      }
      buckets.get(layer)?.push(effect);
    });

    return Array.from(buckets.entries()).map(([layer, instances]) => ({
      layer,
      instances: instances.sort((a, b) => a.createdAt - b.createdAt),
    }));
  }

  /**
   * Stub entrypoint: will route each effect instance to its concrete renderer.
   */
  applyEffects(_context: EffectRenderContext, _layers: PreparedEffectLayer[]): void {
    // TODO: integrate with Skia runtime shaders, mask filters, and custom
    // drawing instructions. Each effect type will map to a dedicated handler:
    //
    // fill -> gradient/pattern/runtime shader (animated)
    // stroke -> multi-stroke/dashed outlines/texture strokes
    // lighting -> glow, shadow, long shadow, bloom
    // distortion/postprocess -> create offscreen surface, apply shader, composite
    // masking -> use clipPath + saveLayer compositing sequence
    // special -> particle systems or sweep highlights driven by Skia animations
    //
    // For now this is intentionally empty; ExportService can call prepareLayers
    // to prime UI previews with effect summaries.
  }

  /**
   * Helper to enumerate unimplemented handlers. Keeps planning centralized so we
   * can tick off effect types as shader modules land.
   */
  getMissingHandlers(): Record<TextEffectType, boolean> {
    const missing: Record<TextEffectType, boolean> = {} as Record<TextEffectType, boolean>;
    (Object.keys(TEXT_EFFECT_DEFINITIONS) as TextEffectType[]).forEach(type => {
      // All handlers are pending until we implement them. The engine exposes
      // this map so future work can assert coverage via tests.
      missing[type] = true;
    });
    return missing;
  }
}

export default TextEffectsEngine;
