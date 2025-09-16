/**
 * Text Templates Service for Text-to-Slides app
 * Provides predefined text layout templates and auto-layout functionality
 */

export interface TextTemplate {
  id: string;
  name: string;
  description: string;
  position: { x: number; y: number };
  fontSize: number;
  color: string;
  backgroundColor: string;
  textAlign: 'left' | 'center' | 'right';
  fontWeight: 'normal' | 'bold';
  maxChars?: number;
  lineHeight?: number;
  padding?: number;
}

export interface AutoLayoutOptions {
  slideWidth: number;
  slideHeight: number;
  textLength: number;
  imagePresent: boolean;
}

class TemplateService {
  private static instance: TemplateService;

  public static getInstance(): TemplateService {
    if (!TemplateService.instance) {
      TemplateService.instance = new TemplateService();
    }
    return TemplateService.instance;
  }

  /**
   * Predefined text templates
   */
  private templates: TextTemplate[] = [
    {
      id: 'center-large',
      name: 'Center Large',
      description: 'Large centered text for headlines',
      position: { x: 50, y: 120 },
      fontSize: 32,
      color: '#FFFFFF',
      backgroundColor: 'rgba(0,0,0,0.6)',
      textAlign: 'center',
      fontWeight: 'bold',
      maxChars: 100,
      lineHeight: 1.2,
      padding: 20,
    },
    {
      id: 'center-medium',
      name: 'Center Medium',
      description: 'Medium centered text for body content',
      position: { x: 50, y: 100 },
      fontSize: 24,
      color: '#FFFFFF',
      backgroundColor: 'rgba(0,0,0,0.5)',
      textAlign: 'center',
      fontWeight: 'bold',
      maxChars: 200,
      lineHeight: 1.3,
      padding: 15,
    },
    {
      id: 'top-left',
      name: 'Top Left',
      description: 'Text positioned at top left',
      position: { x: 30, y: 50 },
      fontSize: 22,
      color: '#FFFFFF',
      backgroundColor: 'rgba(0,0,0,0.4)',
      textAlign: 'left',
      fontWeight: 'bold',
      maxChars: 150,
      lineHeight: 1.3,
      padding: 12,
    },
    {
      id: 'bottom-right',
      name: 'Bottom Right',
      description: 'Text positioned at bottom right',
      position: { x: 200, y: 200 },
      fontSize: 20,
      color: '#FFFFFF',
      backgroundColor: 'rgba(0,0,0,0.5)',
      textAlign: 'right',
      fontWeight: 'bold',
      maxChars: 120,
      lineHeight: 1.2,
      padding: 10,
    },
    {
      id: 'quote-style',
      name: 'Quote Style',
      description: 'Elegant quote formatting',
      position: { x: 40, y: 80 },
      fontSize: 26,
      color: '#FFFFFF',
      backgroundColor: 'rgba(0,0,0,0.3)',
      textAlign: 'center',
      fontWeight: 'normal',
      maxChars: 180,
      lineHeight: 1.4,
      padding: 25,
    },
    {
      id: 'minimal',
      name: 'Minimal',
      description: 'Clean minimal design',
      position: { x: 60, y: 140 },
      fontSize: 28,
      color: '#000000',
      backgroundColor: 'rgba(255,255,255,0.8)',
      textAlign: 'center',
      fontWeight: 'normal',
      maxChars: 80,
      lineHeight: 1.3,
      padding: 20,
    },
  ];

  /**
   * Get all available templates
   */
  public getTemplates(): TextTemplate[] {
    return [...this.templates];
  }

  /**
   * Get a specific template by ID
   */
  public getTemplate(id: string): TextTemplate | null {
    return this.templates.find(template => template.id === id) || null;
  }

  /**
   * Apply a template to text, returning the styled properties
   */
  public applyTemplate(templateId: string, text: string): Partial<TextTemplate> {
    const template = this.getTemplate(templateId);
    if (!template) {
      return this.getDefaultTemplate();
    }

    // Adjust font size based on text length
    let fontSize = template.fontSize;
    if (text.length > (template.maxChars || 200)) {
      fontSize = Math.max(16, fontSize - 4);
    } else if (text.length < 50) {
      fontSize = Math.min(40, fontSize + 4);
    }

    return {
      position: { ...template.position },
      fontSize,
      color: template.color,
      backgroundColor: template.backgroundColor,
      textAlign: template.textAlign,
      fontWeight: template.fontWeight,
    };
  }

  /**
   * Auto-layout text based on content and slide properties
   */
  public autoLayout(options: AutoLayoutOptions): Partial<TextTemplate> {
    const { slideWidth, slideHeight, textLength, imagePresent } = options;
    
    // Calculate optimal position and size based on content
    let fontSize = 24;
    let position = { x: slideWidth * 0.1, y: slideHeight * 0.3 };
    let textAlign: 'left' | 'center' | 'right' = 'center';
    let backgroundColor = 'rgba(0,0,0,0.5)';
    let color = '#FFFFFF';

    // Adjust font size based on text length
    if (textLength > 200) {
      fontSize = 18;
    } else if (textLength > 100) {
      fontSize = 22;
    } else if (textLength < 50) {
      fontSize = 32;
    }

    // Adjust position based on text length and image presence
    if (textLength > 150) {
      // Longer text - position higher and smaller
      position = { x: slideWidth * 0.1, y: slideHeight * 0.2 };
      fontSize = Math.max(16, fontSize - 2);
    } else if (textLength < 30) {
      // Short text - center it
      position = { x: slideWidth * 0.2, y: slideHeight * 0.4 };
      fontSize = Math.min(36, fontSize + 4);
    }

    // Adjust background based on image presence
    if (!imagePresent) {
      backgroundColor = 'rgba(0,0,0,0.3)';
      color = '#333333';
    }

    return {
      position,
      fontSize,
      color,
      backgroundColor,
      textAlign,
      fontWeight: 'bold',
    };
  }

  /**
   * Get default template properties
   */
  public getDefaultTemplate(): Partial<TextTemplate> {
    return {
      position: { x: 50, y: 100 },
      fontSize: 24,
      color: '#FFFFFF',
      backgroundColor: 'rgba(0,0,0,0.5)',
      textAlign: 'center',
      fontWeight: 'bold',
    };
  }

  /**
   * Suggest best template for given text
   */
  public suggestTemplate(text: string): TextTemplate | null {
    const textLength = text.length;
    
    if (textLength < 50) {
      return this.getTemplate('center-large');
    } else if (textLength < 100) {
      return this.getTemplate('center-medium');
    } else if (textLength < 150) {
      return this.getTemplate('quote-style');
    } else {
      return this.getTemplate('top-left');
    }
  }

  /**
   * Create a custom template
   */
  public createCustomTemplate(template: Omit<TextTemplate, 'id'>): TextTemplate {
    const customTemplate: TextTemplate = {
      ...template,
      id: `custom-${Date.now()}`,
    };
    
    this.templates.push(customTemplate);
    return customTemplate;
  }

  /**
   * Get templates suitable for different content types
   */
  public getTemplatesByContentType(contentType: 'headline' | 'body' | 'quote' | 'caption'): TextTemplate[] {
    switch (contentType) {
      case 'headline':
        return this.templates.filter(t => t.id === 'center-large' || t.id === 'minimal');
      case 'body':
        return this.templates.filter(t => t.id === 'center-medium' || t.id === 'top-left');
      case 'quote':
        return this.templates.filter(t => t.id === 'quote-style' || t.id === 'center-medium');
      case 'caption':
        return this.templates.filter(t => t.id === 'bottom-right' || t.id === 'minimal');
      default:
        return this.templates;
    }
  }
}

export default TemplateService.getInstance();
