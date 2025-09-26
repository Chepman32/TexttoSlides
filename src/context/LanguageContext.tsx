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
      appName: 'Before/After',
      pickTwoPhotos: 'Pick Two Photos',
      before: 'Before',
      after: 'After',
      layout: 'Layout',
      labels: 'Labels',
      style: 'Style',
      export: 'Export',
      saveToPhotos: 'Save to Photos',
      share: 'Share',
      settings: 'Settings',
      theme: 'Theme',
      sound: 'Sound',
      haptics: 'Haptics',
      language: 'Language',
      pro: 'Pro',
      getPro: 'Get Pro',
      restorePurchases: 'Restore Purchases',
      watermark: 'Watermark',
      resolution: 'Resolution',
      format: 'Format',
      apply: 'Apply',
      cancel: 'Cancel',
      ok: 'OK',
      continue: 'Continue',
      // Home Screen
      home_continueEditing: 'Continue Editing',
      home_recentTemplates: 'Recent Templates',
      home_tip: 'Pick two photos to create amazing before/after comparisons',

      // Composer Screen
      composer_title: 'Composer',
      composer_swap: 'Swap Photos',
      composer_template: 'Templates',
      composer_aspectRatio: 'Aspect Ratio',
      composer_layoutSideBySide: 'Side by Side',
      composer_layoutVertical: 'Vertical Split',
      composer_layoutSlider: 'Slider Reveal',
      composer_layoutStacked: 'Stacked with Label Bar',
      composer_layoutDiagonal: 'Diagonal Split',
      composer_layoutPolaroid: 'Polaroid Collage',
      composer_spacing: 'Spacing',
      composer_cornerRadius: 'Corner Radius',
      composer_shadow: 'Shadow',
      composer_shadowNone: 'None',
      composer_shadowLow: 'Low',
      composer_shadowMed: 'Medium',
      composer_shadowHigh: 'High',
      composer_cropFree: 'Free',
      composer_crop1to1: '1:1',
      composer_crop3to2: '3:2',
      composer_crop4to3: '4:3',
      composer_crop16to9: '16:9',

      // Labels Panel
      labels_toggle: 'Show Labels',
      labels_beforeText: 'Before Text',
      labels_afterText: 'After Text',
      labels_font: 'Font',
      labels_weight: 'Weight',
      labels_size: 'Size',
      labels_color: 'Color',
      labels_position: 'Position',
      labels_margin: 'Margin',
      labels_presetClassic: 'Classic',
      labels_presetMinimal: 'Minimal',
      labels_presetBoxed: 'Boxed',
      labels_presetBanner: 'Banner',

      // Style Panel
      style_background: 'Background',
      style_backgroundTransparent: 'Transparent',
      style_backgroundSolid: 'Solid',
      style_backgroundGradient: 'Gradient',
      style_frame: 'Frame',
      style_frameToggle: 'Show Frame',
      style_frameThickness: 'Thickness',
      style_frameColor: 'Frame Color',

      // Templates Screen
      templates_title: 'Templates',
      templates_featured: 'Featured',
      templates_minimal: 'Minimal',
      templates_framed: 'Framed',
      templates_social: 'Social',
      templates_preview: 'Preview',
      templates_saveCustom: 'Save as Template',

      // Export Screen
      export_title: 'Export',
      export_estimatedSize: 'Estimated Size',
      export_openIn: 'Open in...',
      export_success: 'Exported successfully!',
      export_permissionDenied: 'Photos permission required',
      export_error: 'Export failed',
      export_lowStorage: 'Insufficient storage space',

      // Onboarding
      onboarding_slide1_title: 'Pick Two Photos',
      onboarding_slide1_subtitle: 'Select before and after images from your gallery',
      onboarding_slide2_title: 'Choose Layout & Labels',
      onboarding_slide2_subtitle: 'Customize how your comparison looks',
      onboarding_slide3_title: 'Export & Share',
      onboarding_slide3_subtitle: 'Save to Photos or share with others',
      onboarding_start: 'Start',

      // Pro Features
      pro_removeWatermark: 'Remove Watermark',
      pro_hdExport: 'HD Export (up to 8K)',
      pro_allTemplates: 'All Premium Templates',
      pro_customFonts: 'Custom Fonts',
      pro_unlimitedHistory: 'Unlimited History',
      pro_lifetime: 'Lifetime',
      pro_monthly: 'Monthly',
      pro_yearly: 'Yearly',

      // Settings Screen
      settings_title: 'Settings',
      settings_theme: 'Theme',
      settings_language: 'Language',
      settings_upgrade: 'Upgrade to Pro',
      settings_restore: 'Restore Purchases',

      // Theme names
      light: 'Light',
      dark: 'Dark',
      solar: 'Solar',
      mono: 'Mono',

      // App Icon section
      app_icon: 'App Icon',
      app_icon_default: 'Default',
      app_icon_blue_dark: 'Blue Dark',
      app_icon_yellow: 'Yellow',
      app_icon_gray: 'Gray',

      // Premium section
      premium: 'Premium',
      pro_version_active: '✓ Pro Version Active',

      // Alert messages
      success: 'Success',
      error: 'Error',
      no_purchases: 'No Purchases',
      purchases_restored: 'Purchases restored successfully!',
      no_previous_purchases: 'No previous purchases found.',
      restore_failed: 'Failed to restore purchases. Please try again.',
      development_mode: 'Development Mode',
      app_icon_dev_message: 'App icon preference saved. Changes will take effect on physical device.',
      app_icon_success: 'App icon changed successfully!',
      app_icon_error: 'Failed to change app icon. Please try again.',

      // Home Screen Actions
      from_camera: 'From\nCamera',
      gallery: 'Gallery',
      templates: 'Templates',
      recent_projects: 'Recent Projects',
      pick_two_photos: 'Pick Two Photos',
    },
  },
  ru: {
    translation: {
      // Common
      appName: 'До/После',
      pickTwoPhotos: 'Выберите две фотографии',
      before: 'До',
      after: 'После',
      layout: 'Макет',
      labels: 'Подписи',
      style: 'Стиль',
      export: 'Экспорт',
      saveToPhotos: 'Сохранить в Фото',
      share: 'Поделиться',
      settings: 'Настройки',
      theme: 'Тема',
      sound: 'Звук',
      haptics: 'Вибрация',
      language: 'Язык',
      pro: 'Pro',
      getPro: 'Получить Pro',
      restorePurchases: 'Восстановить покупки',
      watermark: 'Водяной знак',
      resolution: 'Разрешение',
      format: 'Формат',
      apply: 'Применить',
      cancel: 'Отмена',
      ok: 'OK',
      continue: 'Продолжить',
      
      // Image Selection Screen
      image_selection_title: 'Выберите изображения',
      image_selection_subtitle: 'Выберите фоновые изображения для {{count}} слайда{{plural}}',
      image_selection_slide: 'Слайд {{number}}',
      image_selection_select_image: 'Выбрать изображение',
      image_selection_plain_background: 'Простой фон',
      image_selection_image_selected: 'Изображение выбрано',
      image_selection_plain_selected: 'Выбран простой фон',
      image_selection_no_image: 'Изображение не выбрано',
      image_selection_continue: 'Перейти к редактору',
      image_selection_error: 'Пожалуйста, выберите {{count}} изображений для ваших слайдов',
      image_selection_error_title: 'Ошибка',
      image_selection_error_select_failed: 'Не удалось выбрать изображение. Попробуйте еще раз.',
      
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

      // Theme names
      light: 'Светлая',
      dark: 'Тёмная',
      solar: 'Солнечная',
      mono: 'Монохром',

      // App Icon section
      app_icon: 'Иконка приложения',
      app_icon_default: 'По умолчанию',
      app_icon_blue_dark: 'Синяя тёмная',
      app_icon_yellow: 'Жёлтая',
      app_icon_gray: 'Серая',

      // Premium section
      premium: 'Премиум',
      pro_version_active: '✓ Pro версия активна',

      // Alert messages
      success: 'Успех',
      error: 'Ошибка',
      no_purchases: 'Нет покупок',
      purchases_restored: 'Покупки успешно восстановлены!',
      no_previous_purchases: 'Предыдущие покупки не найдены.',
      restore_failed: 'Не удалось восстановить покупки. Попробуйте еще раз.',
      development_mode: 'Режим разработки',
      app_icon_dev_message: 'Настройки иконки сохранены. Изменения будут применены на реальном устройстве.',
      app_icon_success: 'Иконка приложения успешно изменена!',
      app_icon_error: 'Не удалось изменить иконку приложения. Попробуйте еще раз.',

      // Home Screen Actions
      from_camera: 'Из\nКамеры',
      gallery: 'Галерея',
      templates: 'Шаблоны',
      recent_projects: 'Недавние проекты',
      pick_two_photos: 'Выберите две фотографии',
    },
  },
  de: {
    translation: {
      // Common
      app_name: 'Text zu Folien',
      continue: 'Weiter',
      cancel: 'Abbrechen',
      save: 'Speichern',
      export: 'Exportieren',
      
      // Splash Screen
      splash_title: 'Text zu Folien',
      splash_subtitle: 'Erstellen schöner Folien aus Ihrem Text',
      
      // Home Screen
      home_title: 'Folien erstellen',
      home_subtitle: 'Geben Sie Ihren Text unten ein, um Folien zu generieren',
      home_placeholder: 'Geben Sie Ihren Text hier ein...',
      home_generate_button: 'Folien generieren',
      home_character_count: 'Zeichen: {{count}}',
      home_start_typing: 'Beginnen Sie mit der Eingabe, um die Zeichenanzahl zu sehen',
      home_error_empty: 'Bitte geben Sie Text ein, um Folien zu generieren',
      
      // Image Selection Screen
      image_selection_title: 'Bilder auswählen',
      image_selection_subtitle: 'Wählen Sie Hintergrundbilder für {{count}} Folie{{plural}}',
      image_selection_slide: 'Folie {{number}}',
      image_selection_select_image: 'Bild auswählen',
      image_selection_plain_background: 'Einfacher Hintergrund',
      image_selection_image_selected: 'Bild ausgewählt',
      image_selection_plain_selected: 'Einfacher Hintergrund ausgewählt',
      image_selection_no_image: 'Kein Bild ausgewählt',
      image_selection_continue: 'Zum Editor fortfahren',
      image_selection_error: 'Bitte wählen Sie {{count}} Bilder für Ihre Folien aus',
      image_selection_error_title: 'Fehler',
      image_selection_error_select_failed: 'Bildauswahl fehlgeschlagen. Bitte versuchen Sie es erneut.',
      
      // Editor Screen
      editor_title: 'Folien-Editor',
      editor_slide: 'Folie {{current}} von {{total}}',
      editor_position: 'Textposition',
      editor_size: 'Textgröße',
      editor_preview: 'Folien-Vorschau',
      editor_move_up: 'Nach oben bewegen',
      editor_move_down: 'Nach unten bewegen',
      editor_move_left: 'Nach links bewegen',
      editor_move_right: 'Nach rechts bewegen',
      editor_increase_size: 'Größe erhöhen',
      editor_decrease_size: 'Größe verringern',
      
      // Preview Screen
      preview_title: 'Vorschau',
      preview_export: 'Folien exportieren',
      preview_success: 'Folien erfolgreich exportiert!',
      preview_empty: 'Keine Folien zur Vorschau',
      
      // Settings Screen
      settings_title: 'Einstellungen',
      settings_theme: 'Design',
      settings_language: 'Sprache',
      settings_sound: 'Ton',
      settings_haptics: 'Haptik',
      settings_upgrade: 'Auf Pro upgraden',
      settings_restore: 'Käufe wiederherstellen',

      // Theme names
      light: 'Hell',
      dark: 'Dunkel',
      solar: 'Solar',
      mono: 'Mono',

      // App Icon section
      app_icon: 'App-Symbol',
      app_icon_default: 'Standard',
      app_icon_blue_dark: 'Blau Dunkel',
      app_icon_yellow: 'Gelb',
      app_icon_gray: 'Grau',

      // Premium section
      premium: 'Premium',
      pro_version_active: '✓ Pro Version aktiv',

      // Alert messages
      success: 'Erfolg',
      error: 'Fehler',
      no_purchases: 'Keine Käufe',
      purchases_restored: 'Käufe erfolgreich wiederhergestellt!',
      no_previous_purchases: 'Keine vorherigen Käufe gefunden.',
      restore_failed: 'Wiederherstellung fehlgeschlagen. Bitte versuchen Sie es erneut.',
      development_mode: 'Entwicklungsmodus',
      app_icon_dev_message: 'App-Symbol-Einstellung gespeichert. Änderungen werden auf dem physischen Gerät wirksam.',
      app_icon_success: 'App-Symbol erfolgreich geändert!',
      app_icon_error: 'App-Symbol konnte nicht geändert werden. Bitte versuchen Sie es erneut.',

      // Home Screen Actions
      from_camera: 'Von\nKamera',
      gallery: 'Galerie',
      templates: 'Vorlagen',
      recent_projects: 'Letzte Projekte',
      pick_two_photos: 'Zwei Fotos auswählen',
    },
  },
  fr: {
    translation: {
      // Common
      app_name: 'Texte en Diapositives',
      continue: 'Continuer',
      cancel: 'Annuler',
      save: 'Enregistrer',
      export: 'Exporter',
      
      // Splash Screen
      splash_title: 'Texte en Diapositives',
      splash_subtitle: 'Création de belles diapositives à partir de votre texte',
      
      // Home Screen
      home_title: 'Créer des diapositives',
      home_subtitle: 'Entrez votre texte ci-dessous pour générer des diapositives',
      home_placeholder: 'Entrez votre texte ici...',
      home_generate_button: 'Générer des diapositives',
      home_character_count: 'Caractères: {{count}}',
      home_start_typing: 'Commencez à taper pour voir le nombre de caractères',
      home_error_empty: 'Veuillez entrer du texte pour générer des diapositives',
      
      // Image Selection Screen
      image_selection_title: 'Sélectionner des images',
      image_selection_subtitle: 'Choisissez des images de fond pour {{count}} diapositive{{plural}}',
      image_selection_slide: 'Diapositive {{number}}',
      image_selection_select_image: 'Sélectionner une image',
      image_selection_plain_background: 'Arrière-plan uni',
      image_selection_image_selected: 'Image sélectionnée',
      image_selection_plain_selected: 'Arrière-plan uni sélectionné',
      image_selection_no_image: 'Aucune image sélectionnée',
      image_selection_continue: 'Continuer vers l\'éditeur',
      image_selection_error: 'Veuillez sélectionner {{count}} images pour vos diapositives',
      image_selection_error_title: 'Erreur',
      image_selection_error_select_failed: 'Échec de la sélection d\'image. Veuillez réessayer.',
      
      // Editor Screen
      editor_title: 'Éditeur de diapositives',
      editor_slide: 'Diapositive {{current}} sur {{total}}',
      editor_position: 'Position du texte',
      editor_size: 'Taille du texte',
      editor_preview: 'Aperçu des diapositives',
      editor_move_up: 'Déplacer vers le haut',
      editor_move_down: 'Déplacer vers le bas',
      editor_move_left: 'Déplacer vers la gauche',
      editor_move_right: 'Déplacer vers la droite',
      editor_increase_size: 'Augmenter la taille',
      editor_decrease_size: 'Diminuer la taille',
      
      // Preview Screen
      preview_title: 'Aperçu',
      preview_export: 'Exporter les diapositives',
      preview_success: 'Diapositives exportées avec succès!',
      preview_empty: 'Aucune diapositive à prévisualiser',
      
      // Settings Screen
      settings_title: 'Paramètres',
      settings_theme: 'Thème',
      settings_language: 'Langue',
      settings_sound: 'Son',
      settings_haptics: 'Haptique',
      settings_upgrade: 'Passer à Pro',
      settings_restore: 'Restaurer les achats',

      // Theme names
      light: 'Clair',
      dark: 'Sombre',
      solar: 'Solaire',
      mono: 'Mono',

      // App Icon section
      app_icon: 'Icône d\'app',
      app_icon_default: 'Par défaut',
      app_icon_blue_dark: 'Bleu foncé',
      app_icon_yellow: 'Jaune',
      app_icon_gray: 'Gris',

      // Premium section
      premium: 'Premium',
      pro_version_active: '✓ Version Pro active',

      // Alert messages
      success: 'Succès',
      error: 'Erreur',
      no_purchases: 'Aucun achat',
      purchases_restored: 'Achats restaurés avec succès!',
      no_previous_purchases: 'Aucun achat précédent trouvé.',
      restore_failed: 'Échec de la restauration. Veuillez réessayer.',
      development_mode: 'Mode Développement',
      app_icon_dev_message: 'Préférence d\'icône sauvegardée. Les changements prendront effet sur l\'appareil physique.',
      app_icon_success: 'Icône d\'app changée avec succès!',
      app_icon_error: 'Échec du changement d\'icône. Veuillez réessayer.',

      // Home Screen Actions
      from_camera: 'De la\nCaméra',
      gallery: 'Galerie',
      templates: 'Modèles',
      recent_projects: 'Projets récents',
      pick_two_photos: 'Choisir deux photos',
    },
  },
  pt: {
    translation: {
      // Common
      app_name: 'Texto para Slides',
      continue: 'Continuar',
      cancel: 'Cancelar',
      save: 'Salvar',
      export: 'Exportar',
      
      // Splash Screen
      splash_title: 'Texto para Slides',
      splash_subtitle: 'Criando slides bonitos a partir do seu texto',
      
      // Home Screen
      home_title: 'Criar Slides',
      home_subtitle: 'Digite seu texto abaixo para gerar slides',
      home_placeholder: 'Digite seu texto aqui...',
      home_generate_button: 'Gerar Slides',
      home_character_count: 'Caracteres: {{count}}',
      home_start_typing: 'Comece a digitar para ver a contagem de caracteres',
      home_error_empty: 'Por favor, digite texto para gerar slides',
      
      // Image Selection Screen
      image_selection_title: 'Selecionar Imagens',
      image_selection_subtitle: 'Escolha imagens de fundo para {{count}} slide{{plural}}',
      image_selection_slide: 'Slide {{number}}',
      image_selection_select_image: 'Selecionar Imagem',
      image_selection_plain_background: 'Fundo Simples',
      image_selection_image_selected: 'Imagem selecionada',
      image_selection_plain_selected: 'Fundo simples selecionado',
      image_selection_no_image: 'Nenhuma imagem selecionada',
      image_selection_continue: 'Continuar para o Editor',
      image_selection_error: 'Por favor, selecione {{count}} imagens para seus slides',
      image_selection_error_title: 'Erro',
      image_selection_error_select_failed: 'Falha ao selecionar imagem. Tente novamente.',
      
      // Editor Screen
      editor_title: 'Editor de Slides',
      editor_slide: 'Slide {{current}} de {{total}}',
      editor_position: 'Posição do Texto',
      editor_size: 'Tamanho do Texto',
      editor_preview: 'Visualizar Slides',
      editor_move_up: 'Mover para Cima',
      editor_move_down: 'Mover para Baixo',
      editor_move_left: 'Mover para Esquerda',
      editor_move_right: 'Mover para Direita',
      editor_increase_size: 'Aumentar Tamanho',
      editor_decrease_size: 'Diminuir Tamanho',
      
      // Preview Screen
      preview_title: 'Visualização',
      preview_export: 'Exportar Slides',
      preview_success: 'Slides exportados com sucesso!',
      preview_empty: 'Nenhum slide para visualizar',
      
      // Settings Screen
      settings_title: 'Configurações',
      settings_theme: 'Tema',
      settings_language: 'Idioma',
      settings_sound: 'Som',
      settings_haptics: 'Háptico',
      settings_upgrade: 'Atualizar para Pro',
      settings_restore: 'Restaurar Compras',

      // Theme names
      light: 'Claro',
      dark: 'Escuro',
      solar: 'Solar',
      mono: 'Mono',

      // App Icon section
      app_icon: 'Ícone do App',
      app_icon_default: 'Padrão',
      app_icon_blue_dark: 'Azul Escuro',
      app_icon_yellow: 'Amarelo',
      app_icon_gray: 'Cinza',

      // Premium section
      premium: 'Premium',
      pro_version_active: '✓ Versão Pro Ativa',

      // Alert messages
      success: 'Sucesso',
      error: 'Erro',
      no_purchases: 'Sem Compras',
      purchases_restored: 'Compras restauradas com sucesso!',
      no_previous_purchases: 'Nenhuma compra anterior encontrada.',
      restore_failed: 'Falha ao restaurar compras. Tente novamente.',
      development_mode: 'Modo de Desenvolvimento',
      app_icon_dev_message: 'Preferência de ícone salva. As mudanças terão efeito no dispositivo físico.',
      app_icon_success: 'Ícone do app alterado com sucesso!',
      app_icon_error: 'Falha ao alterar ícone do app. Tente novamente.',

      // Home Screen Actions
      from_camera: 'Da\nCâmera',
      gallery: 'Galeria',
      templates: 'Modelos',
      recent_projects: 'Projetos recentes',
      pick_two_photos: 'Escolha duas fotos',
    },
  },
  ja: {
    translation: {
      // Common
      app_name: 'テキストをスライドに',
      continue: '続行',
      cancel: 'キャンセル',
      save: '保存',
      export: 'エクスポート',
      
      // Splash Screen
      splash_title: 'テキストをスライドに',
      splash_subtitle: 'テキストから美しいスライドを作成',
      
      // Home Screen
      home_title: 'スライドを作成',
      home_subtitle: '下にテキストを入力してスライドを生成',
      home_placeholder: 'ここにテキストを入力...',
      home_generate_button: 'スライドを生成',
      home_character_count: '文字数: {{count}}',
      home_start_typing: '入力開始で文字数を表示',
      home_error_empty: 'スライドを生成するためにテキストを入力してください',
      
      // Image Selection Screen
      image_selection_title: '画像を選択',
      image_selection_subtitle: '{{count}}枚のスライド{{plural}}の背景画像を選択',
      image_selection_slide: 'スライド {{number}}',
      image_selection_select_image: '画像を選択',
      image_selection_plain_background: 'プレーン背景',
      image_selection_image_selected: '画像が選択されました',
      image_selection_plain_selected: 'プレーン背景が選択されました',
      image_selection_no_image: '画像が選択されていません',
      image_selection_continue: 'エディターに続行',
      image_selection_error: 'スライドのために{{count}}枚の画像を選択してください',
      image_selection_error_title: 'エラー',
      image_selection_error_select_failed: '画像の選択に失敗しました。もう一度お試しください。',
      
      // Editor Screen
      editor_title: 'スライドエディター',
      editor_slide: '{{total}}枚中{{current}}枚目',
      editor_position: 'テキスト位置',
      editor_size: 'テキストサイズ',
      editor_preview: 'スライドをプレビュー',
      editor_move_up: '上に移動',
      editor_move_down: '下に移動',
      editor_move_left: '左に移動',
      editor_move_right: '右に移動',
      editor_increase_size: 'サイズを増加',
      editor_decrease_size: 'サイズを減少',
      
      // Preview Screen
      preview_title: 'プレビュー',
      preview_export: 'スライドをエクスポート',
      preview_success: 'スライドが正常にエクスポートされました！',
      preview_empty: 'プレビューするスライドがありません',
      
      // Settings Screen
      settings_title: '設定',
      settings_theme: 'テーマ',
      settings_language: '言語',
      settings_sound: '音',
      settings_haptics: 'ハプティック',
      settings_upgrade: 'Proにアップグレード',
      settings_restore: '購入を復元',

      // Theme names
      light: 'ライト',
      dark: 'ダーク',
      solar: 'ソーラー',
      mono: 'モノ',

      // App Icon section
      app_icon: 'アプリアイコン',
      app_icon_default: 'デフォルト',
      app_icon_blue_dark: 'ブルーダーク',
      app_icon_yellow: 'イエロー',
      app_icon_gray: 'グレー',

      // Premium section
      premium: 'プレミアム',
      pro_version_active: '✓ Pro版アクティブ',

      // Alert messages
      success: '成功',
      error: 'エラー',
      no_purchases: '購入なし',
      purchases_restored: '購入が正常に復元されました！',
      no_previous_purchases: '以前の購入が見つかりません。',
      restore_failed: '購入の復元に失敗しました。再試行してください。',
      development_mode: '開発モード',
      app_icon_dev_message: 'アプリアイコンの設定が保存されました。物理デバイスで変更が反映されます。',
      app_icon_success: 'アプリアイコンが正常に変更されました！',
      app_icon_error: 'アプリアイコンの変更に失敗しました。再試行してください。',

      // Home Screen Actions
      from_camera: 'カメラ\nから',
      gallery: 'ギャラリー',
      templates: 'テンプレート',
      recent_projects: '最近のプロジェクト',
      pick_two_photos: '2枚の写真を選択',
    },
  },
  zh: {
    translation: {
      // Common
      app_name: '文本转幻灯片',
      continue: '继续',
      cancel: '取消',
      save: '保存',
      export: '导出',
      
      // Splash Screen
      splash_title: '文本转幻灯片',
      splash_subtitle: '从您的文本创建精美的幻灯片',
      
      // Home Screen
      home_title: '创建幻灯片',
      home_subtitle: '在下方输入文本以生成幻灯片',
      home_placeholder: '在此输入您的文本...',
      home_generate_button: '生成幻灯片',
      home_character_count: '字符数: {{count}}',
      home_start_typing: '开始输入以查看字符数',
      home_error_empty: '请输入文本以生成幻灯片',
      
      // Image Selection Screen
      image_selection_title: '选择图片',
      image_selection_subtitle: '为{{count}}张幻灯片{{plural}}选择背景图片',
      image_selection_slide: '幻灯片 {{number}}',
      image_selection_select_image: '选择图片',
      image_selection_plain_background: '纯色背景',
      image_selection_image_selected: '已选择图片',
      image_selection_plain_selected: '已选择纯色背景',
      image_selection_no_image: '未选择图片',
      image_selection_continue: '继续到编辑器',
      image_selection_error: '请为您的幻灯片选择{{count}}张图片',
      image_selection_error_title: '错误',
      image_selection_error_select_failed: '选择图片失败。请重试。',
      
      // Editor Screen
      editor_title: '幻灯片编辑器',
      editor_slide: '第{{current}}张，共{{total}}张',
      editor_position: '文本位置',
      editor_size: '文本大小',
      editor_preview: '预览幻灯片',
      editor_move_up: '向上移动',
      editor_move_down: '向下移动',
      editor_move_left: '向左移动',
      editor_move_right: '向右移动',
      editor_increase_size: '增大尺寸',
      editor_decrease_size: '减小尺寸',
      
      // Preview Screen
      preview_title: '预览',
      preview_export: '导出幻灯片',
      preview_success: '幻灯片导出成功！',
      preview_empty: '没有幻灯片可预览',
      
      // Settings Screen
      settings_title: '设置',
      settings_theme: '主题',
      settings_language: '语言',
      settings_sound: '声音',
      settings_haptics: '触觉反馈',
      settings_upgrade: '升级到专业版',
      settings_restore: '恢复购买',

      // Theme names
      light: '浅色',
      dark: '深色',
      solar: '太阳',
      mono: '单色',

      // App Icon section
      app_icon: '应用图标',
      app_icon_default: '默认',
      app_icon_blue_dark: '深蓝色',
      app_icon_yellow: '黄色',
      app_icon_gray: '灰色',

      // Premium section
      premium: '高级版',
      pro_version_active: '✓ 专业版已激活',

      // Alert messages
      success: '成功',
      error: '错误',
      no_purchases: '无购买记录',
      purchases_restored: '购买记录恢复成功！',
      no_previous_purchases: '未找到之前的购买记录。',
      restore_failed: '恢复购买失败。请重试。',
      development_mode: '开发模式',
      app_icon_dev_message: '应用图标偏好已保存。更改将在物理设备上生效。',
      app_icon_success: '应用图标更改成功！',
      app_icon_error: '更改应用图标失败。请重试。',

      // Home Screen Actions
      from_camera: '来自\n相机',
      gallery: '图库',
      templates: '模板',
      recent_projects: '最近项目',
      pick_two_photos: '选择两张照片',
    },
  },
  ko: {
    translation: {
      // Common
      app_name: '텍스트를 슬라이드로',
      continue: '계속',
      cancel: '취소',
      save: '저장',
      export: '내보내기',
      
      // Splash Screen
      splash_title: '텍스트를 슬라이드로',
      splash_subtitle: '텍스트로 아름다운 슬라이드 만들기',
      
      // Home Screen
      home_title: '슬라이드 만들기',
      home_subtitle: '아래에 텍스트를 입력하여 슬라이드를 생성하세요',
      home_placeholder: '여기에 텍스트를 입력하세요...',
      home_generate_button: '슬라이드 생성',
      home_character_count: '문자 수: {{count}}',
      home_start_typing: '입력을 시작하면 문자 수를 볼 수 있습니다',
      home_error_empty: '슬라이드를 생성하려면 텍스트를 입력해주세요',
      
      // Image Selection Screen
      image_selection_title: '이미지 선택',
      image_selection_subtitle: '{{count}}개의 슬라이드{{plural}}에 대한 배경 이미지를 선택하세요',
      image_selection_slide: '슬라이드 {{number}}',
      image_selection_select_image: '이미지 선택',
      image_selection_plain_background: '단색 배경',
      image_selection_image_selected: '이미지가 선택되었습니다',
      image_selection_plain_selected: '단색 배경이 선택되었습니다',
      image_selection_no_image: '이미지가 선택되지 않았습니다',
      image_selection_continue: '편집기로 계속',
      image_selection_error: '슬라이드를 위해 {{count}}개의 이미지를 선택해주세요',
      image_selection_error_title: '오류',
      image_selection_error_select_failed: '이미지 선택에 실패했습니다. 다시 시도해주세요.',
      
      // Editor Screen
      editor_title: '슬라이드 편집기',
      editor_slide: '{{total}}개 중 {{current}}개',
      editor_position: '텍스트 위치',
      editor_size: '텍스트 크기',
      editor_preview: '슬라이드 미리보기',
      editor_move_up: '위로 이동',
      editor_move_down: '아래로 이동',
      editor_move_left: '왼쪽으로 이동',
      editor_move_right: '오른쪽으로 이동',
      editor_increase_size: '크기 증가',
      editor_decrease_size: '크기 감소',
      
      // Preview Screen
      preview_title: '미리보기',
      preview_export: '슬라이드 내보내기',
      preview_success: '슬라이드가 성공적으로 내보내졌습니다!',
      preview_empty: '미리볼 슬라이드가 없습니다',
      
      // Settings Screen
      settings_title: '설정',
      settings_theme: '테마',
      settings_language: '언어',
      settings_sound: '소리',
      settings_haptics: '햅틱 피드백',
      settings_upgrade: 'Pro로 업그레이드',
      settings_restore: '구매 복원',

      // Theme names
      light: '라이트',
      dark: '다크',
      solar: '솔라',
      mono: '모노',

      // App Icon section
      app_icon: '앱 아이콘',
      app_icon_default: '기본',
      app_icon_blue_dark: '블루 다크',
      app_icon_yellow: '옐로우',
      app_icon_gray: '그레이',

      // Premium section
      premium: '프리미엄',
      pro_version_active: '✓ Pro 버전 활성화',

      // Alert messages
      success: '성공',
      error: '오류',
      no_purchases: '구매 없음',
      purchases_restored: '구매가 성공적으로 복원되었습니다!',
      no_previous_purchases: '이전 구매를 찾을 수 없습니다.',
      restore_failed: '구매 복원에 실패했습니다. 다시 시도해주세요.',
      development_mode: '개발 모드',
      app_icon_dev_message: '앱 아이콘 설정이 저장되었습니다. 실제 기기에서 변경 사항이 적용됩니다.',
      app_icon_success: '앱 아이콘이 성공적으로 변경되었습니다!',
      app_icon_error: '앱 아이콘 변경에 실패했습니다. 다시 시도해주세요.',

      // Home Screen Actions
      from_camera: '카메라\n에서',
      gallery: '갤러리',
      templates: '템플릿',
      recent_projects: '최근 프로젝트',
      pick_two_photos: '두 장의 사진 선택',
    },
  },
  uk: {
    translation: {
      // Common
      app_name: 'Текст у Слайди',
      continue: 'Продовжити',
      cancel: 'Скасувати',
      save: 'Зберегти',
      export: 'Експорт',
      
      // Splash Screen
      splash_title: 'Текст у Слайди',
      splash_subtitle: 'Створення красивих слайдів з вашого тексту',
      
      // Home Screen
      home_title: 'Створити слайди',
      home_subtitle: 'Введіть текст нижче, щоб створити слайди',
      home_placeholder: 'Введіть ваш текст тут...',
      home_generate_button: 'Створити слайди',
      home_character_count: 'Символів: {{count}}',
      home_start_typing: 'Почніть друкувати, щоб побачити кількість символів',
      home_error_empty: 'Будь ласка, введіть текст для створення слайдів',
      
      // Image Selection Screen
      image_selection_title: 'Вибрати зображення',
      image_selection_subtitle: 'Виберіть фонові зображення для {{count}} слайда{{plural}}',
      image_selection_slide: 'Слайд {{number}}',
      image_selection_select_image: 'Вибрати зображення',
      image_selection_plain_background: 'Простий фон',
      image_selection_image_selected: 'Зображення вибрано',
      image_selection_plain_selected: 'Вибрано простий фон',
      image_selection_no_image: 'Зображення не вибрано',
      image_selection_continue: 'Перейти до редактора',
      image_selection_error: 'Будь ласка, виберіть {{count}} зображень для ваших слайдів',
      image_selection_error_title: 'Помилка',
      image_selection_error_select_failed: 'Не вдалося вибрати зображення. Спробуйте ще раз.',
      
      // Editor Screen
      editor_title: 'Редактор слайдів',
      editor_slide: 'Слайд {{current}} з {{total}}',
      editor_position: 'Позиція тексту',
      editor_size: 'Розмір тексту',
      editor_preview: 'Попередній перегляд',
      editor_move_up: 'Перемістити вгору',
      editor_move_down: 'Перемістити вниз',
      editor_move_left: 'Перемістити вліво',
      editor_move_right: 'Перемістити вправо',
      editor_increase_size: 'Збільшити розмір',
      editor_decrease_size: 'Зменшити розмір',
      
      // Preview Screen
      preview_title: 'Попередній перегляд',
      preview_export: 'Експортувати слайди',
      preview_success: 'Слайди успішно експортовано!',
      preview_empty: 'Немає слайдів для попереднього перегляду',
      
      // Settings Screen
      settings_title: 'Налаштування',
      settings_theme: 'Тема',
      settings_language: 'Мова',
      settings_sound: 'Звук',
      settings_haptics: 'Вібрація',
      settings_upgrade: 'Оновити до Pro',
      settings_restore: 'Відновити покупки',

      // Theme names
      light: 'Світла',
      dark: 'Темна',
      solar: 'Сонячна',
      mono: 'Моно',

      // App Icon section
      app_icon: 'Іконка додатку',
      app_icon_default: 'За замовчуванням',
      app_icon_blue_dark: 'Синя темна',
      app_icon_yellow: 'Жовта',
      app_icon_gray: 'Сіра',

      // Premium section
      premium: 'Преміум',
      pro_version_active: '✓ Pro версія активна',

      // Alert messages
      success: 'Успіх',
      error: 'Помилка',
      no_purchases: 'Немає покупок',
      purchases_restored: 'Покупки успішно відновлено!',
      no_previous_purchases: 'Попередні покупки не знайдено.',
      restore_failed: 'Не вдалося відновити покупки. Спробуйте ще раз.',
      development_mode: 'Режим розробки',
      app_icon_dev_message: 'Налаштування іконки збережено. Зміни набудуть чинності на фізичному пристрої.',
      app_icon_success: 'Іконку додатку успішно змінено!',
      app_icon_error: 'Не вдалося змінити іконку додатку. Спробуйте ще раз.',

      // Home Screen Actions
      from_camera: 'З\nКамери',
      gallery: 'Галерея',
      templates: 'Шаблони',
      recent_projects: 'Нещодавні проекти',
      pick_two_photos: 'Виберіть дві фотографії',
    },
  },
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
      image_selection_no_image: 'Ninguna imagen seleccionada',
      image_selection_continue: 'Continuar al Editor',
      image_selection_error: 'Por favor selecciona {{count}} imágenes para tus diapositivas',
      image_selection_error_title: 'Error',
      image_selection_error_select_failed: 'Error al seleccionar imagen. Inténtalo de nuevo.',
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

      // Theme names
      light: 'Claro',
      dark: 'Oscuro',
      solar: 'Solar',
      mono: 'Mono',

      // App Icon section
      app_icon: 'Icono de App',
      app_icon_default: 'Por defecto',
      app_icon_blue_dark: 'Azul Oscuro',
      app_icon_yellow: 'Amarillo',
      app_icon_gray: 'Gris',

      // Premium section
      premium: 'Premium',
      pro_version_active: '✓ Versión Pro Activa',

      // Alert messages
      success: 'Éxito',
      error: 'Error',
      no_purchases: 'Sin Compras',
      purchases_restored: '¡Compras restauradas exitosamente!',
      no_previous_purchases: 'No se encontraron compras anteriores.',
      restore_failed: 'Error al restaurar compras. Inténtalo de nuevo.',
      development_mode: 'Modo de Desarrollo',
      app_icon_dev_message: 'Preferencia de icono guardada. Los cambios tendrán efecto en el dispositivo físico.',
      app_icon_success: '¡Icono de app cambiado exitosamente!',
      app_icon_error: 'Error al cambiar el icono de la app. Inténtalo de nuevo.',

      // Home Screen Actions
      from_camera: 'De la\nCámara',
      gallery: 'Galería',
      templates: 'Plantillas',
      recent_projects: 'Proyectos recientes',
      pick_two_photos: 'Elegir dos fotos',
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
