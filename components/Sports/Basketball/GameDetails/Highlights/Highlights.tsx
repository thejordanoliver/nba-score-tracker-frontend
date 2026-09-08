import HeadingTwo from "components/Headings/HeadingTwo";
import { Colors, Fonts } from "constants/styles";
import React, { useCallback, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import type { Highlight } from "types/types";

import { HighlightItem } from "./HighlightItem";

type HighlightVideoProps = {
  highlights: Highlight[] | undefined;
  isDark: boolean;
};

export const Highlights = React.memo(function Highlights({
  highlights,
  isDark,
}: HighlightVideoProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);

  const styles = useMemo(() => HighlightsStyles(isDark), [isDark]);

  const handlePlay = useCallback((id: string) => {
    // Only one video can be active at a time.
    setPlayingId(id);
  }, []);

  const handleEnd = useCallback((id: string) => {
    setPlayingId((currentId) => (currentId === id ? null : currentId));
  }, []);

  if (!highlights?.length) {
    return null;
  }

  return (
    <View style={styles.section}>
      <HeadingTwo isDark={isDark}>Highlights</HeadingTwo>

      <View style={styles.listContainer}>
        {highlights.map((item, index) => (
          <View
            key={item.id}
            style={[
              styles.itemContainer,
              index < highlights.length - 1 && styles.itemSeparator,
            ]}
          >
            <HighlightItem
              item={item}
              isPlaying={playingId === item.id}
              onEnd={handleEnd}
              onPlay={handlePlay}
              isDark={isDark}
            />
          </View>
        ))}
      </View>
    </View>
  );
});

export const HighlightsStyles = (isDark: boolean) => {
  const pressedBackgroundColor = isDark
    ? Colors.dark.transparentItemBackground
    : Colors.light.transparentItemBackground;
  const textColor = isDark ? Colors.white : Colors.black;
  const secondaryTextColor = isDark ? Colors.lightGray : Colors.darkGray;
  const separatorColor = isDark ? Colors.lightGray : Colors.darkGray;

  return StyleSheet.create({
    section: {
      width: "100%",
    },

    listContainer: {
      borderColor: Colors.midTone,
      borderRadius: 10,
      borderWidth: 1,
      overflow: "hidden",
    },

    itemContainer: {
      width: "100%",
    },

    itemSeparator: {
      borderBottomColor: separatorColor,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },

    row: {
      paddingHorizontal: 10,
      paddingVertical: 10,
      width: "100%",
    },

    rowPressed: {
      backgroundColor: pressedBackgroundColor,
    },

    rowContent: {
      alignItems: "center",
      flexDirection: "row",
      width: "100%",
    },

    thumbnailWrapper: {
      backgroundColor: Colors.black,
      borderRadius: 7,
      height: 68,
      overflow: "hidden",
      position: "relative",
      width: 112,
    },

    thumbnail: {
      height: "100%",
      width: "100%",
    },

    thumbnailPlayOverlay: {
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.42)",
      borderRadius: 18,
      height: 34,
      justifyContent: "center",
      left: "50%",
      marginLeft: -17,
      marginTop: -17,
      position: "absolute",
      top: "50%",
      width: 34,
    },

    durationBadge: {
      backgroundColor: "rgba(0,0,0,0.82)",
      borderRadius: 4,
      bottom: 4,
      paddingHorizontal: 5,
      paddingVertical: 2,
      position: "absolute",
      right: 4,
    },

    durationText: {
      color: Colors.white,
      fontFamily: Fonts.BOLD,
      fontSize: 10,
    },

    infoContainer: {
      flex: 1,
      justifyContent: "center",
      minWidth: 0,
      paddingHorizontal: 12,
    },

    headline: {
      color: textColor,
      fontFamily: Fonts.BOLD,
      fontSize: 14,
      lineHeight: 18,
    },

    metadata: {
      color: secondaryTextColor,
      fontFamily: Fonts.REGULAR,
      fontSize: 11,
      lineHeight: 15,
      marginTop: 4,
    },

    playButton: {
      alignItems: "center",
      backgroundColor: isDark ? "rgba(255,255,255,0.12)" : Colors.black,
      borderRadius: 19,
      height: 38,
      justifyContent: "center",
      marginLeft: 4,
      width: 38,
    },

    expandedVideoWrapper: {
      aspectRatio: 16 / 9,
      backgroundColor: Colors.black,
      position: "relative",
      width: "100%",
    },

    video: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: Colors.black,
    },

    closeButton: {
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.72)",
      borderRadius: 18,
      height: 36,
      justifyContent: "center",
      position: "absolute",
      right: 8,
      top: 8,
      width: 36,
      zIndex: 10,
    },

    unavailable: {
      color: secondaryTextColor,
      fontFamily: Fonts.REGULAR,
      fontSize: 11,
      marginTop: 4,
    },
  });
};
