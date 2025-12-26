import React, { useCallback, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  ScrollViewProps,
  View,
} from 'react-native';

interface VerticalPagerProps extends ScrollViewProps {
  /** Number of pages to divide content into. Defaults to 3. */
  pageCount?: number;
}

/**
 * A scrollable container with page-based snapping.
 * Content is divided into equal pages that snap with each swipe.
 */
const VerticalPager: React.FC<VerticalPagerProps> = ({
  children,
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  pageCount = 3,
  onScroll,
  ...rest
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const currentPage = useRef(0);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setContainerHeight(event.nativeEvent.layout.height);
  }, []);

  const handleContentSizeChange = useCallback(
    (_width: number, height: number) => {
      setContentHeight(height);
    },
    [],
  );

  // Calculate page height - each page shows one "screen" worth of content
  const getPageHeight = () => {
    if (containerHeight <= 0 || contentHeight <= containerHeight) {
      return 0;
    }
    // Divide scrollable area into (pageCount - 1) intervals
    // so we have pageCount snap positions
    return (contentHeight - containerHeight) / (pageCount - 1);
  };

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const pageHeight = getPageHeight();

      if (pageHeight <= 0) return;

      // Determine which page we're closest to
      const targetPage = Math.round(offsetY / pageHeight);
      const clampedPage = Math.max(0, Math.min(pageCount - 1, targetPage));

      if (clampedPage !== currentPage.current) {
        currentPage.current = clampedPage;
        // Snap to the page
        scrollViewRef.current?.scrollTo({
          y: clampedPage * pageHeight,
          animated: true,
        });
      }
    },
    [containerHeight, contentHeight, pageCount],
  );

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      handleScrollEnd(event);
    },
    [handleScrollEnd],
  );

  return (
    <ScrollView
      ref={scrollViewRef}
      {...rest}
      style={style}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      onLayout={handleLayout}
      onContentSizeChange={handleContentSizeChange}
      onMomentumScrollEnd={handleMomentumScrollEnd}
      onScrollEndDrag={handleScrollEnd}
      decelerationRate="fast"
      keyboardShouldPersistTaps="handled"
      bounces={true}
    >
      {children}
    </ScrollView>
  );
};

export default VerticalPager;
