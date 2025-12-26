import React from 'react';
import { ScrollView, ScrollViewProps } from 'react-native';

type VerticalPagerProps = ScrollViewProps;

/**
 * A simple scrollable container for tool panels.
 * Uses free scrolling (no paging/snapping) to ensure all content
 * is easily accessible and visible on physical devices.
 */
const VerticalPager: React.FC<VerticalPagerProps> = ({
  children,
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  ...rest
}) => {
  return (
    <ScrollView
      {...rest}
      style={style}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      keyboardShouldPersistTaps="handled"
      bounces={true}
    >
      {children}
    </ScrollView>
  );
};

export default VerticalPager;
