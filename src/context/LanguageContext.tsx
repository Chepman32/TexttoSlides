import React, { createContext, useContext, ReactNode } from 'react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { usePreferences } from '../hooks/usePreferences';

// Define supported languages
export type Language = 'en' | 'ru' | 'es' | 'de' | 'fr' | 'pt' | 'ja' | 'zh' | 'ko' | 'uk';

// Translation resources
const resources = {
  en: {
    translation: {
      // Common
      app_name: 'Text to Slides',
      continue: 'Continue',
      cancel: 'Cancel',
      save: 'Save',
      export: 'Export',
      
      // Splash Screen
      splash_title: 'Text to Slides',
      splash_subtitle: 'Creating beautiful slides from your text',
      
      // Home Screen
      home_title: 'Create Slides',
      home_subtitle: 'Enter your text below to generate slides',
      home_placeholder: 'Enter your text here...',
      home_generate_button: 'Generate Slides',
      home_character_count: 'Characters: {{count}}',
      home_start_typing: 'Start typing to see character count',
      home_error_empty: 'Please enter some text to generate slides',
      
      // Image Selection Screen
      image_selection_title: 'Select Images',
      image_selection_subtitle: 'Choose background images for your {{count}} slide{{plural}}',
      image_selection_slide: 'Slide {{number}}',
      image_selection_select_image: 'Select Image',
      image_selection_plain_background: 'Plain Background',
      image_selection_image_selected: 'Image selected',
      image_selection_plain_selected: 'Plain background selected',
      image_selection_continue: 'Continue to Editor',
      image_selection_error: 'Please select {{count}} images for your slides',
      
      // Editor Screen
      editor_title: 'Slide Editor',
      editor_slide: 'Slide {{current}} of {{total}}',
      editor_position: 'Text Position',
      editor_size: 'Text Size',
      editor_preview: 'Preview Slides',
      editor_move_up: 'Move Up',
      editor_move_down: 'Move Down',
      editor_move_left: 'Move Left',
      editor_move_right: 'Move Right',
      editor_increase_size: 'Increase Size',
      editor_decrease_size: 'Decrease Size',
      
      // Preview Screen
      preview_title: 'Preview',
      preview_export: 'Export Slides',
      preview_success: 'Slides exported successfully!',
      preview_empty: 'No slides to preview',
      
      // Settings Screen
      settings_title: 'Settings',
      settings_theme: 'Theme',
      settings_language: 'Language',
      settings_sound: 'Sound',
      settings_haptics: 'Haptics',
      settings_upgrade: 'Upgrade to Pro',
      settings_restore: 'Restore Purchases',
    },
  },
  ru: {
    translation: {
      // Common
      app_name: 'Текст в Слайды',
      continue: 'Продолжить',
      cancel: 'Отмена',
      save: 'Сохранить',
      export: 'Экспорт',
      
      // Splash Screen
      splash_title: 'Текст в Слайды',
      splash_subtitle: 'Создание красивых слайдов из вашего текста',
      
      // Home Screen
      home_title: 'Создать слайды',
      home_subtitle: 'Введите текст ниже, чтобы создать слайды',
      home_placeholder: 'Введите ваш текст здесь...',
      home_generate_button: 'Создать слайды',
      home_character_count: 'Символов: {{count}}',
      home_start_typing: 'Начните печатать, чтобы увидеть количество символов',
      home_error_empty: 'Пожалуйста, введите текст для создания слайдов',
      
      // Image Selection Screen
      image_selection_title: 'Выберите изображения',
      image_selection_subtitle: 'Выберите фоновые изображения для {{count}} слайда{{plural}}',
      image_selection_slide: 'Слайд {{number}}',
      image_selection_select_image: 'Выбрать изображение',
      image_selection_plain_background: 'Простой фон',
      image_selection_image_selected: 'Изображение выбрано',
      image_selection_plain_selected: 'Выбран простой фон',
      image_selection_continue: 'Перейти к редактору',
      image_selection_error: 'Пожалуйста, выберите {{count}} изображений для ваших слайдов',
      
      // Editor Screen
      editor_title: 'Редактор слайдов',
      editor_slide: 'Слайд {{current}} из {{total}}',
      editor_position: 'Позиция текста',
      editor_size: 'Размер текста',
      editor_preview: 'Предварительный просмотр',
      editor_move_up: 'Переместить вверх',
      editor_move_down: 'Переместить вниз',
      editor_move_left: 'Переместить влево',
      editor_move_right: 'Переместить вправо',
      editor_increase_size: 'Увеличить размер',
      editor_decrease_size: 'Уменьшить размер',
      
      // Preview Screen
      preview_title: 'Предварительный просмотр',
      preview_export: 'Экспортировать слайды',
      preview_success: 'Слайды успешно экспортированы!',
      preview_empty: 'Нет слайдов для предварительного просмотра',
      
      // Settings Screen
      settings_title: 'Настройки',
      settings_theme: 'Тема',
      settings_language: 'Язык',
      settings_sound: 'Звук',
      settings_haptics: 'Вибрация',
      settings_upgrade: 'Обновить до Pro',
      settings_restore: 'Восстановить покупки',
    },
  },
  // Additional languages would be added here
  es: {
    translation: {
      app_name: 'Texto a Diapositivas',
      continue: 'Continuar',
      cancel: 'Cancelar',
      save: 'Guardar',
      export: 'Exportar',
      splash_title: 'Texto a Diapositivas',
      splash_subtitle: 'Creando diapositivas hermosas a partir de tu texto',
      home_title: 'Crear Diapositivas',
      home_subtitle: 'Ingresa tu texto abajo para generar diapositivas',
      home_placeholder: 'Ingresa tu texto aquí...',
      home_generate_button: 'Generar Diapositivas',
      home_character_count: 'Caracteres: {{count}}',
      home_start_typing: 'Empieza a escribir para ver el conteo de caracteres',
      home_error_empty: 'Por favor ingresa texto para generar diapositivas',
      image_selection_title: 'Seleccionar Imágenes',
      image_selection_subtitle: 'Elige imágenes de fondo para {{count}} diapositiva{{plural}}',
      image_selection_slide: 'Diapositiva {{number}}',
      image_selection_select_image: 'Seleccionar Imagen',
      image_selection_plain_background: 'Fondo Plano',
      image_selection_image_selected: 'Imagen seleccionada',
      image_selection_plain_selected: 'Fondo plano seleccionado',
      image_selection_continue: 'Continuar al Editor',
      image_selection_error: 'Por favor selecciona {{count}} imágenes para tus diapositivas',
      editor_title: 'Editor de Diapositivas',
      editor_slide: 'Diapositiva {{current}} de {{total}}',
      editor_position: 'Posición del Texto',
      editor_size: 'Tamaño del Texto',
      editor_preview: 'Previsualizar Diapositivas',
      editor_move_up: 'Mover Arriba',
      editor_move_down: 'Mover Abajo',
      editor_move_left: 'Mover Izquierda',
      editor_move_right: 'Mover Derecha',
      editor_increase_size: 'Aumentar Tamaño',
      editor_decrease_size: 'Reducir Tamaño',
      preview_title: 'Previsualización',
      preview_export: 'Exportar Diapositivas',
      preview_success: '¡Diapositivas exportadas exitosamente!',
      preview_empty: 'No hay diapositivas para previsualizar',
      settings_title: 'Configuración',
      settings_theme: 'Tema',
      settings_language: 'Idioma',
      settings_sound: 'Sonido',
      settings_haptics: 'Hápticos',
      settings_upgrade: 'Actualizar a Pro',
      settings_restore: 'Restaurar Compras',
    },
  },
};

// Initialize i18n
i18n.use(initReactI18next).init({
  resources,
  lng: 'en', // default language
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // react already safes from xss
  },
});

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
  t: typeof i18n.t;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { preferences, updatePreferences } = usePreferences();
  
  const setLanguage = (language: Language) => {
    updatePreferences({ language });
    i18n.changeLanguage(language);
  };

  return (
    <LanguageContext.Provider value={{ 
      currentLanguage: preferences.language, 
      setLanguage, 
      t: i18n.t 
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;