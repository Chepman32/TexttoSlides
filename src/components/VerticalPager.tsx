import React, { useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, ScrollView, ScrollViewProps } from 'react-native';

type VerticalPagerProps = ScrollViewProps;

const VerticalPager: React.FC<VerticalPagerProps> = ({
  children,
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  onLayout,
  onContentSizeChange,
  decelerationRate,
  snapToOffsets,
  snapToAlignment,
  disableIntervalMomentum,
  pagingEnabled,
  ...rest
}) => {
  const [containerHeight, setContainerHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setContainerHeight(event.nativeEvent.layout.height);
    if (onLayout) {
      onLayout(event);
    }
  }, [onLayout]);

  const handleContentSizeChange = useCallback((width: number, height: number) => {
    setContentHeight(height);
    if (onContentSizeChange) {
      onContentSizeChange(width, height);
    }
  }, [onContentSizeChange]);

  const shouldEnablePaging = containerHeight > 0 && contentHeight > containerHeight;

  const computedSnapOffsets = useMemo(() => {
    if (!shouldEnablePaging) return undefined;
    const pageCount = Math.ceil(contentHeight / containerHeight);
    return Array.from({ length: pageCount }, (_, index) => index * containerHeight);
  }, [shouldEnablePaging, contentHeight, containerHeight]);

  const finalPagingEnabled = shouldEnablePaging || pagingEnabled;
  const finalSnapToOffsets = shouldEnablePaging ? computedSnapOffsets : snapToOffsets;
  const finalDecelerationRate = shouldEnablePaging ? 'fast' : decelerationRate;
  const finalSnapToAlignment = shouldEnablePaging ? 'start' : snapToAlignment;
  const finalDisableIntervalMomentum = shouldEnablePaging ? true : disableIntervalMomentum;

  return (
    <ScrollView
      {...rest}
      style={style}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      onLayout={handleLayout}
      onContentSizeChange={handleContentSizeChange}
      pagingEnabled={finalPagingEnabled}
      snapToOffsets={finalSnapToOffsets}
      snapToAlignment={finalSnapToAlignment}
      decelerationRate={finalDecelerationRate}
      disableIntervalMomentum={finalDisableIntervalMomentum}
    >
      {children}
    </ScrollView>
  );
};

export default VerticalPager;
