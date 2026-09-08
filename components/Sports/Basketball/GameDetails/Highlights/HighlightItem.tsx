import { Ionicons } from "@expo/vector-icons";
import AppVideo from "components/AppVideo";
import { Colors } from "constants/styles";
import { Image } from "expo-image";
import React, { useCallback, useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import type { Highlight } from "types/types";
import { HighlightsStyles } from "./Highlights";

interface HighlightItemProps {
  item: Highlight;
  isPlaying: boolean;
  onPlay: (id: string) => void;
  onEnd: (id: string) => void;
  isLast?: boolean;
  isDark: boolean;
}

type HighlightMetadata = Highlight & {
  duration?: number | string | null;
  description?: string | null;
  shortDescription?: string | null;
  period?: number | string | null;
  clock?: string | null;
};

const getPlayableUrl = (item: Highlight): string | null =>
  item.links?.source?.HLS?.href ||
  item.links?.hls ||
  item.links?.source?.href ||
  item.links?.mp4 ||
  item.links?.mobile ||
  null;

function formatDuration(
  duration: number | string | null | undefined,
): string | null {
  if (duration == null) return null;

  if (typeof duration === "string") {
    const trimmed = duration.trim();

    if (!trimmed) return null;

    // Already formatted, e.g. "0:24"
    if (trimmed.includes(":")) {
      return trimmed;
    }

    const parsed = Number(trimmed);

    if (!Number.isFinite(parsed)) {
      return null;
    }

    duration = parsed;
  }

  if (!Number.isFinite(duration)) {
    return null;
  }

  const totalSeconds = Math.max(0, Math.round(duration));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function getMetadata(item: HighlightMetadata): string | null {
  if (item.shortDescription?.trim()) {
    return item.shortDescription.trim();
  }

  if (item.description?.trim()) {
    return item.description.trim();
  }

  const parts: string[] = [];

  if (item.period != null) {
    const period =
      typeof item.period === "number"
        ? `${item.period}${getOrdinalSuffix(item.period)}`
        : String(item.period);

    parts.push(period);
  }

  if (item.clock?.trim()) {
    parts.push(item.clock.trim());
  }

  return parts.length > 0 ? parts.join(" • ") : null;
}

function getOrdinalSuffix(value: number): string {
  const mod100 = value % 100;

  if (mod100 >= 11 && mod100 <= 13) {
    return "th";
  }

  switch (value % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

export const HighlightItem = React.memo(function HighlightItem({
  item,
  isPlaying,
  onPlay,
  onEnd,
  isDark,
}: HighlightItemProps) {
  const styles = HighlightsStyles(isDark);
  const metadataItem = item as HighlightMetadata;

  const videoSource = getPlayableUrl(item);

  const duration = useMemo(
    () => formatDuration(metadataItem.duration),
    [metadataItem.duration],
  );

  const metadata = useMemo(() => getMetadata(metadataItem), [metadataItem]);

  const handlePlay = useCallback(() => {
    if (!videoSource) return;

    onPlay(item.id);
  }, [item.id, onPlay, videoSource]);

  const handleEnd = useCallback(() => {
    onEnd(item.id);
  }, [item.id, onEnd]);

  if (isPlaying && videoSource) {
    return (
      <View style={styles.expandedVideoWrapper}>
        <AppVideo
          uri={videoSource}
          style={styles.video}
          contentFit="contain"
          autoPlay
          nativeControls
          onEnd={handleEnd}
        />

        <Pressable
          accessibilityLabel="Close highlight video"
          accessibilityRole="button"
          hitSlop={10}
          onPress={handleEnd}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={20} color={Colors.white} />
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityHint={
        videoSource
          ? "Plays this highlight video"
          : "This highlight video is unavailable"
      }
      accessibilityLabel={item.headline || "Game highlight"}
      accessibilityRole="button"
      disabled={!videoSource}
      onPress={handlePlay}
      style={({ pressed }) => [
        styles.row,
        pressed && videoSource && styles.rowPressed,
      ]}
    >
      <View style={styles.rowContent}>
        <View style={styles.thumbnailWrapper}>
          <Image
            accessibilityLabel=""
            contentFit="cover"
            recyclingKey={item.id}
            source={item.thumbnail}
            style={styles.thumbnail}
            transition={150}
          />

          {videoSource && (
            <View pointerEvents="none" style={styles.thumbnailPlayOverlay}>
              <Ionicons name="play" size={18} color={Colors.white} />
            </View>
          )}

          {duration && (
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{duration}</Text>
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text numberOfLines={2} style={styles.headline}>
            {item.headline || "Game highlight"}
          </Text>

          {metadata ? (
            <Text numberOfLines={1} style={styles.metadata}>
              {metadata}
            </Text>
          ) : !videoSource ? (
            <Text numberOfLines={1} style={styles.unavailable}>
              Video unavailable
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
});
