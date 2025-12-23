# Before/After - iOS Photo Comparison App

**Before/After** is an offline-first iOS app that lets users pick two photos from their device gallery and compose a single image labeled "Before" / "After". The app features gorgeous animations built with React Native Reanimated and react-native-skia, including support for multiple layouts, label customization, and high-quality exports.

## 🚀 Project Overview

This project was transformed from a TexttoSlides app into a comprehensive Before/After photo comparison editor called Snapduo. The app supports 4 themes (Light, Dark, Solar, Mono), sound & haptics, full localization (10 languages), and exports high-quality composites to Photos.

### Key Features

- **Offline-first**: All core operations work offline
- **4 Layout Types**: Side-by-Side, Vertical Split, Slider Reveal, Stacked with Label Bar
- **Advanced Label Controls**: Customizable fonts, colors, positions, and sizing
- **Theme System**: 4 beautiful themes with proper color tokens
- **Multi-language**: Supports 10 languages (en, ru, es, de, fr, pt, ja, zh, ko, uk)
- **High-Performance Rendering**: Powered by react-native-skia
- **Smooth Animations**: React Native Reanimated for 60fps interactions

## 🏗️ Architecture

### Tech Stack

- **React Native** (0.81.4) with TypeScript
- **@shopify/react-native-skia** (2.2.15) - High-performance canvas rendering
- **react-native-reanimated** (4.1.0) - Smooth animations
- **react-native-image-picker** (8.2.1) - Photo selection
- **@react-native-camera-roll/camera-roll** (7.10.2) - Photo export
- **@react-navigation/stack** (7.4.8) - Navigation
- **i18next** + **react-i18next** - Localization
- **react-native-haptic-feedback** - Haptic feedback

### Project Structure

```
src/
├── components/
│   └── CompositionCanvas.tsx      # Main Skia canvas for rendering
├── screens/
│   ├── HomeScreen.tsx             # Main entry point with photo picker
│   ├── ComposerScreen.tsx         # Main editor with layout/label controls
│   └── SettingsScreen.tsx         # App settings and preferences
├── context/
│   ├── ThemeContext.tsx           # Theme management (4 themes)
│   └── LanguageContext.tsx        # Localization (10 languages)
├── types/
│   └── composer.ts                # TypeScript interfaces for composition
├── navigation/
│   └── AppNavigator.tsx           # React Navigation setup
└── services/
    ├── FeedbackService.ts         # Haptic feedback
    └── IAPService.ts              # In-app purchases (ready for Pro features)
```

## ✅ Completed Features

### Core Functionality

- [x] **Navigation System** - Complete React Navigation setup with proper routing
- [x] **Photo Selection** - Native image picker with support for before/after photos
- [x] **Home Screen** - Clean UI with primary photo picker action and template previews
- [x] **Composer Screen** - Full-featured editor with tool panels and real-time preview

### Canvas & Rendering

- [x] **Skia Canvas Integration** - High-performance rendering engine
- [x] **4 Layout Types**:
  - [x] Side-by-Side (horizontal comparison)
  - [x] Vertical Split (stacked comparison)
  - [x] Slider Reveal (interactive reveal effect)
  - [x] Stacked with Label Bar (modern overlay style)
- [x] **Image Processing** - Proper scaling, cropping, and aspect ratio handling
- [x] **Shadow System** - 4 shadow intensity levels (None, Low, Med, High)
- [x] **Corner Radius** - Adjustable rounded corners for modern look
- [x] **Watermark System** - Geometric overlay for free tier

### Label System

- [x] **Toggle Labels** - Show/hide before/after text
- [x] **Text Editing** - Customizable before/after text content
- [x] **Font Controls**:
  - [x] Size slider (12-48px with visual feedback)
  - [x] Weight options (Regular, Medium, Bold)
  - [x] Color picker (8 preset colors)
  - [x] Position controls (Top/Bottom Left/Right)
- [x] **Real-time Preview** - All changes reflect instantly in canvas

### Theme & Localization

- [x] **4-Theme System** - Light, Dark, Solar, Mono with proper color tokens
- [x] **Before/After Color Tokens** - Canvas-specific colors (labelBg, watermark, etc.)
- [x] **10-Language Support** - Complete localization infrastructure
- [x] **Theme-Aware UI** - All components respect current theme

### Technical Infrastructure

- [x] **TypeScript Integration** - Full type safety with proper interfaces
- [x] **State Management** - Composition state with undo/redo history (10 steps)
- [x] **Error Handling** - Robust Skia rendering with fallbacks
- [x] **Performance Optimization** - 60fps canvas rendering
- [x] **Haptic Feedback** - Integrated throughout UI interactions

## 📋 TODO - Remaining Tasks

### High Priority

- [ ] **Basic Export Functionality**

  - [ ] Render canvas to image file
  - [ ] Save to Photos with proper permissions
  - [ ] Share sheet integration
  - [ ] Export quality settings

- [ ] **Interactive Slider Handle**
  - [ ] Draggable handle for slider layout
  - [ ] Haptic feedback on drag
  - [ ] Smooth position tracking

### Medium Priority

- [ ] **Template System**

  - [ ] Create template presets (Classic, Minimal, Frame, etc.)
  - [ ] Template modal with live previews
  - [ ] Save custom templates
  - [ ] Template categories (Featured, Social, etc.)

- [ ] **Enhanced IAP Integration**
  - [ ] Connect to StoreKit 2 APIs
  - [ ] Pro feature gates (watermark removal, HD export)
  - [ ] Subscription management
  - [ ] Purchase restoration

### Low Priority

- [ ] **Advanced Features**

  - [ ] Custom fonts for labels
  - [ ] Gradient backgrounds
  - [ ] Advanced shadow controls
  - [ ] Batch export mode
  - [ ] Template sharing

- [ ] **Polish & UX**
  - [ ] Animated splash screen (physics breakdown/text twist)
  - [ ] Onboarding flow
  - [ ] Advanced tutorials
  - [ ] Accessibility improvements

## 🎨 Design System

### Themes

The app supports 4 carefully designed themes:

**Light Theme**

- Background: `#F8FAFC`
- Surface: `#FFFFFF`
- Text Primary: `#0F172A`
- Accent: `#2563EB`

**Dark Theme**

- Background: `#0B1020`
- Surface: `#111827`
- Text Primary: `#E5E7EB`
- Accent: `#60A5FA`

**Solar Theme**

- Background: `#FFF8E1`
- Surface: `#FFFCF2`
- Text Primary: `#4E342E`
- Accent: `#F59E0B`

**Mono Theme**

- Background: `#F3F3F3`
- Surface: `#FFFFFF`
- Text Primary: `#1F1F1F`
- Accent: `#8A8A8A`

### Layout Types

1. **Side-by-Side** - Photos displayed horizontally with adjustable spacing
2. **Vertical Split** - Photos stacked vertically for before/after progression
3. **Slider Reveal** - Interactive reveal effect showing transformation
4. **Stacked** - Main image with small thumbnail and labels in bottom bar

## 🛠️ Development

### Prerequisites

- Node.js >= 20
- React Native development environment
- iOS development setup (Xcode, etc.)

### Installation

```bash
yarn install
cd ios && pod install && cd ..
```

### Running the App

```bash
yarn ios
```

### Available Scripts

- `yarn ios` - Run on iOS simulator
- `yarn start` - Start Metro bundler
- `yarn lint` - Run ESLint
- `yarn test` - Run tests

## 📱 Usage

1. **Launch App** - See the Before/After home screen
2. **Pick Photos** - Tap "Pick Two Photos" to select before/after images
3. **Choose Layout** - Select from 4 layout types in the Layout panel
4. **Customize Labels** - Adjust text, fonts, colors, and positions in Labels panel
5. **Style Composition** - Fine-tune shadows, spacing, and aspect ratios
6. **Export** - Save your comparison to Photos or share with others

## 🔧 Technical Notes

### Skia Canvas Rendering

The app uses react-native-skia for high-performance canvas rendering. Key implementation details:

- **Group Clipping** - Used for rounded corners and masks
- **Image Loading** - Async loading with placeholder fallbacks
- **Shadow System** - GPU-accelerated shadow rendering
- **Theme Integration** - Dynamic color theming throughout canvas

### State Management

- **Composition State** - Central state for all editor properties
- **Undo/Redo History** - 10-step history with structural sharing
- **Real-time Updates** - Optimized re-rendering for smooth interactions

### Performance Optimizations

- **60fps Animations** - React Native Reanimated for smooth interactions
- **Efficient Re-renders** - Minimal canvas updates on state changes
- **Memory Management** - Proper cleanup of Skia resources
- **Image Optimization** - Smart scaling and caching

## 📊 Implementation Status

### Completed (✅)

- Core navigation and routing
- Photo selection and loading
- 4 layout types with Skia rendering
- Comprehensive label controls
- Theme system with 4 themes
- Localization infrastructure
- State management with undo/redo
- Error handling and performance optimization

### In Progress (🚧)

- Export functionality
- Interactive slider controls
- Template system

### Planned (📋)

- IAP integration
- Advanced features
- Polish and UX improvements

## 🚀 Future Enhancements

- **AR Integration** - Live camera before/after comparisons
- **Video Support** - Animated before/after transitions
- **Cloud Sync** - Template and composition syncing
- **Social Features** - Share templates with community
- **Advanced Export** - Multiple formats, watermark customization

## 📄 License

This project is private and proprietary. All rights reserved.

---

**Built with ❤️ using React Native, Skia, and Reanimated**

_Transform your photos into compelling before/after stories_ ✨
