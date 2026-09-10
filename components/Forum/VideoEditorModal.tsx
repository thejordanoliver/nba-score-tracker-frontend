import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { Colors, Fonts } from "constants/styles";
import { usePreferences } from "contexts/PreferencesContext";
import { useEventListener } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import * as VideoThumbnails from "expo-video-thumbnails";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ForumVideoEditorModalProps } from "types/forum";

export default function VideoEditorModal({
  visible,
  videoUri,
  initialThumbnailUri,
  initialTrimStartMs = 0,
  initialTrimEndMs,
  onClose,
  onSave,
}: ForumVideoEditorModalProps) {
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = getStyles(isDark);
  const [videoReady, setVideoReady] = useState(false);

  const [durationMs, setDurationMs] = useState(0);
  const [trimStartMs, setTrimStartMs] = useState(initialTrimStartMs);
  const [trimEndMs, setTrimEndMs] = useState(initialTrimEndMs ?? 0);
  const [thumbTimeMs, setThumbTimeMs] = useState(initialTrimStartMs);
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(
    initialThumbnailUri ?? null,
  );
  const [thumbnailChanged, setThumbnailChanged] = useState(false);
  const player = useVideoPlayer(videoUri, (player) => {
    player.loop = false;
    player.pause();
  });

  useEventListener(player, "sourceLoad", ({ duration }) => {
    const durationMillis = Math.floor(duration * 1000);

    setDurationMs(durationMillis);
    setTrimEndMs((prev) => (prev > 0 ? prev : durationMillis));
    setVideoReady(true);
  });

  const scrubTo = async (ms: number) => {
    try {
      player.currentTime = ms / 1000;
    } catch {}
  };

  // --- Reset state when opening ---
  useEffect(() => {
    if (!visible) return;

    setTrimStartMs(initialTrimStartMs);
    setTrimEndMs(initialTrimEndMs ?? 0);
    setThumbTimeMs(initialTrimStartMs);
    setThumbnailUri(initialThumbnailUri ?? null);
    setThumbnailChanged(false); // ✅ reset
  }, [
    initialThumbnailUri,
    initialTrimEndMs,
    initialTrimStartMs,
    videoUri,
    visible,
  ]);

  const maxEnd = useMemo(() => (durationMs > 0 ? durationMs : 1), [durationMs]);

  // --- Thumbnail generation (explicit only) ---
  const captureThumbnail = async (timeMs: number) => {
    if (!durationMs || durationMs <= 1) return;

    const safeTime = Math.floor(
      Math.min(Math.max(timeMs, 0), Math.max(durationMs - 200, 0)),
    );

    try {
      player.pause();
      await new Promise((r) => setTimeout(r, 150));

      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
        time: safeTime,
      });

      setThumbnailUri(uri);
      setThumbnailChanged(true);
    } catch (e) {
      console.warn("Thumbnail capture failed", e);
      Alert.alert(
        "Thumbnail Error",
        "Could not generate thumbnail from this video.",
      );
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <SafeAreaView style={styles.container}>
        <View style={styles.wrapper}>
          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
              <Ionicons name="close" size={24} color={Colors.white} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Edit video</Text>

            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => {
                if (!thumbnailUri) {
                  Alert.alert(
                    "Pick a thumbnail",
                    "Tap “Set thumbnail” before saving.",
                  );
                  return;
                }

                onSave({
                  thumbnailUri,
                  trimStartMs,
                  trimEndMs: trimEndMs || maxEnd,
                });

                onClose();
              }}
            >
              <Text style={styles.save}>Save</Text>
            </TouchableOpacity>
          </View>

          {/* VIDEO */}
          <VideoView
            player={player}
            style={styles.video}
            contentFit="contain"
            nativeControls
            fullscreenOptions={{ enable: true }}
          />

          {/* TRIM */}
          <Text style={styles.sectionTitle}>Trim</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Start</Text>
            <Text style={styles.value}>{Math.floor(trimStartMs / 1000)}s</Text>
          </View>
          <Slider
            minimumValue={0}
            maximumValue={durationMs || 1}
            value={trimStartMs}
            onValueChange={(v) => {
              const ms = Math.floor(v);
              setThumbTimeMs(ms);
              scrubTo(ms);
            }}
          />

          <View style={styles.row}>
            <Text style={styles.label}>End</Text>
            <Text style={styles.value}>
              {Math.floor((trimEndMs || maxEnd) / 1000)}s
            </Text>
          </View>
          <Slider
            minimumValue={0}
            maximumValue={durationMs || 1}
            value={trimEndMs || maxEnd}
            onValueChange={(v) => {
              const ms = Math.floor(v);
              setThumbTimeMs(ms);
              scrubTo(ms);
            }}
          />

          {/* THUMBNAIL */}
          <Text style={styles.sectionTitle}>Thumbnail</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Frame time</Text>
            <Text style={styles.value}>{Math.floor(thumbTimeMs / 1000)}s</Text>
          </View>

          <Slider
            minimumValue={0}
            maximumValue={durationMs || 1}
            value={thumbTimeMs}
            onValueChange={(v) => {
              const ms = Math.floor(v);
              setThumbTimeMs(ms);
              scrubTo(ms);
            }}
          />

          <TouchableOpacity
            style={[styles.thumbBtn, !videoReady && { opacity: 0.5 }]}
            disabled={!videoReady}
            onPress={async () => {
              await scrubTo(thumbTimeMs);
              await captureThumbnail(thumbTimeMs);
            }}
          >
            <Ionicons name="image-outline" size={18} color={Colors.white} />
            <Text style={styles.thumbBtnText}>Set thumbnail</Text>
          </TouchableOpacity>

          <Text style={styles.note}>
            {thumbnailChanged
              ? "Thumbnail selected ✅"
              : "Pick a frame for your thumbnail"}
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function getStyles(isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      backgroundColor: isDark ? Colors.black : Colors.white,
      overflow: "hidden",
    },
    wrapper: {
      padding: 12,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginVertical: 20,
    },
    headerBtn: { padding: 8 },
    headerTitle: {
      fontFamily: Fonts.MEDIUM,
      fontSize: 18,
      color: isDark ? Colors.white : Colors.black,
    },
    save: {
      fontFamily: Fonts.MEDIUM,
      fontSize: 18,
      color: Colors.white,
    },
    video: {
      width: "100%",
      height: 220,
      borderRadius: 12,
    },
    sectionTitle: {
      marginTop: 12,
      marginBottom: 6,
      fontFamily: Fonts.BOLD,
      fontSize: 14,
      color: Colors.white,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    label: {
      fontFamily: Fonts.REGULAR,
      color: Colors.lightGray,
    },
    value: {
      fontFamily: Fonts.REGULAR,
      color: Colors.white,
    },
    thumbBtn: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: 8,
      marginTop: 10,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.25)",
      borderRadius: 10,
    },
    thumbBtnText: {
      fontFamily: Fonts.REGULAR,
      color: Colors.white,
    },
    note: {
      marginTop: 8,
      fontFamily: Fonts.REGULAR,
      color: Colors.lightGray,
    },
  });
}
