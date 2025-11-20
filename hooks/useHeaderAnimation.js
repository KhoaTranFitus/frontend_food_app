import { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { useRef } from "react";

export const useHeaderAnimation = () => {
  const scrollY = useSharedValue(0);
  const headerOpacity = useSharedValue(1);
  const lastScrollY = useRef(0);

  const handleScroll = (event) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    scrollY.value = currentScrollY;

    // Lướt xuống (scroll down) -> ẩn header
    if (currentScrollY > lastScrollY.current + 10) {
      headerOpacity.value = withTiming(0, { duration: 300 });
    }
    // Lướt lên (scroll up) -> hiển thị header
    else if (currentScrollY < lastScrollY.current - 10) {
      headerOpacity.value = withTiming(1, { duration: 300 });
    }

    lastScrollY.current = currentScrollY;
  };

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: headerOpacity.value,
      height: headerOpacity.value === 0 ? 0 : 'auto',
    };
  });

  return {
    handleScroll,
    headerAnimatedStyle,
  };
};
