import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  FlatList,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
} from "react-native";

const { width } = Dimensions.get("window");

export default function BannerCarousel({
  images = [
    require("../assets/banner1.jpg"),
    require("../assets/banner2.jpg"),
    require("../assets/banner3.jpg"),
  ],
  autoPlayInterval = 3000,
  height = 180,
}) {
  const flatRef = useRef(null);
  const timerRef = useRef(null);
  const currentIndexRef = useRef(0);
  const [index, setIndex] = useState(0);

  const startAutoPlay = useCallback(() => {
    if (timerRef.current) return;
    if (!images || images.length <= 1) return;
    timerRef.current = setInterval(() => {
      let next = (currentIndexRef.current + 1) % images.length;
      if (flatRef.current) {
        flatRef.current.scrollToIndex({ index: next, animated: true });
      }
      currentIndexRef.current = next;
      setIndex(next);
    }, autoPlayInterval);
  }, [images, autoPlayInterval]);

  const stopAutoPlay = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    // start autoplay when mounted
    startAutoPlay();
    return () => {
      stopAutoPlay();
    };
  }, [startAutoPlay, stopAutoPlay]);

  // keep index in sync when user scrolls
  const onViewRef = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      const viewIndex = viewableItems[0].index ?? 0;
      currentIndexRef.current = viewIndex;
      setIndex(viewIndex);
    }
  });
  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const onTouchStart = () => {
    // user started interaction -> pause autoplay
    stopAutoPlay();
  };

  const onTouchEnd = () => {
    // resume autoplay after small delay to avoid immediate snap
    // give user a moment; resume only if more than 1 image
    if (images && images.length > 1) {
      // small delay so scroll/momentum finishes
      setTimeout(() => {
        startAutoPlay();
      }, 800);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity activeOpacity={1} style={{ width, height }}>
      <Image
        source={item}
        style={[styles.image, { width, height }]}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  const getItemLayout = (_, i) => ({
    length: width,
    offset: width * i,
    index: i,
  });

  return (
    <View style={[styles.container, { height }]}>
      <FlatList
        ref={flatRef}
        data={images}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled={Platform.OS !== "web"} // pagingEnabled behaves differently on web
        snapToAlignment="center"
        snapToInterval={width}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onScrollBeginDrag={onTouchStart}
        onScrollEndDrag={onTouchEnd}
        onMomentumScrollBegin={onTouchStart}
        onMomentumScrollEnd={onTouchEnd}
        onViewableItemsChanged={onViewRef.current}
        viewabilityConfig={viewConfigRef.current}
      />

      {/* pagination dots */}
      <View style={styles.pagination}>
        {images.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === index ? styles.dotActive : null,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  image: {
    borderRadius: 12,
    // on iOS need overflow hidden at parent to clip rounded corners
    // we keep image style simple; wrap if needed
  },
  pagination: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.5)",
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: "#fff",
    width: 10,
    height: 10,
  },
});
