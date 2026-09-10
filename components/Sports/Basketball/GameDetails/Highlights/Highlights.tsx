import HeadingTwo from "components/Headings/HeadingTwo";
import React, { useCallback, useMemo, useState } from "react";
import { View } from "react-native";
import type { Highlight } from "types/types";
import { HighlightItem } from "./HighlightItem";
import { HighlightsStyles } from "./HighlightsStyles";

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
