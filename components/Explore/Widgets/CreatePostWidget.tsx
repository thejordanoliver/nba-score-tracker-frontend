import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts, activeOpacity } from "constants/styles";
import { useRouter } from "expo-router";
import { useAuth } from "hooks/UserHooks/useAuth";
import { useCallback, useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { ExploreWidgetSize } from "types/widgets";
import { WidgetEditControls } from "./WidgetSlider";
import { BlurView } from "expo-blur";

type CreatePostWidgetProps = {
  isDark: boolean;
  size: ExploreWidgetSize;
  width: number;
  height: number;
  widgetId: string;
  widgetSize: ExploreWidgetSize;
  isEditing: boolean;
  availableSizeOptions: readonly ExploreWidgetSize[];
  onResizeWidget: (widgetId: string, size: ExploreWidgetSize) => void;
  onRemoveWidget: (widgetId: string) => void;
  onMoveWidget: (widgetId: string, direction: -1 | 1) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
};

export default function CreatePostWidget({
  isDark,
  size,
  width,
  height,
  widgetId,
  widgetSize,
  isEditing,
  availableSizeOptions,
  onResizeWidget,
  onRemoveWidget,
  onMoveWidget,
  canMoveUp,
  canMoveDown,
}: CreatePostWidgetProps) {
  const router = useRouter();
  const { user } = useAuth();
  const compact = size === "small" || width < 240 || height < 260;
  const styles = useMemo(
    () => createPostWidgetStyles(isDark, compact, isEditing),
    [compact, isDark, isEditing],
  );

  const handleCreatePost = useCallback(() => {
    if (isEditing) return;
    router.push({
      pathname: "/create-post",
      params: {
        currentUserId: user?.id == null ? undefined : String(user.id),
      },
    });
  }, [isEditing, router, user?.id]);

  return (
    <BlurView intensity={100} style={styles.container}>
      <TouchableOpacity
        activeOpacity={activeOpacity}
        disabled={isEditing}
        onPress={handleCreatePost}
        style={styles.content}
        accessibilityRole="button"
        accessibilityLabel="Create a post"
        accessibilityHint="Opens the new post composer"
        accessibilityState={{ disabled: isEditing }}
      >
        <View style={styles.iconWrap}>
          <Ionicons
            name="create-outline"
            size={compact ? 24 : 28}
            color={isDark ? Colors.white : Colors.black}
          />
        </View>

        <View style={styles.copy}>
          <Text style={styles.title}>Create Post</Text>
          <Text style={styles.description} numberOfLines={compact ? 2 : 3}>
            Share a take, start a discussion, or post an update.
          </Text>
        </View>

        <View style={styles.action}>
          <Text style={styles.actionText}>Create</Text>
          <Ionicons
            name="arrow-forward"
            size={16}
            color={isDark ? Colors.black : Colors.white}
          />
        </View>
      </TouchableOpacity>

      {isEditing ? (
        <WidgetEditControls
          isDark={isDark}
          widgetId={widgetId}
          widgetSize={widgetSize}
          availableSizeOptions={availableSizeOptions}
          onResizeWidget={
            availableSizeOptions.length > 1 ? onResizeWidget : undefined
          }
          onRemoveWidget={onRemoveWidget}
          onMoveWidget={onMoveWidget}
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
          compact={compact}
        />
      ) : null}
    </BlurView>
  );
}

const createPostWidgetStyles = (
  isDark: boolean,
  compact: boolean,
  isEditing: boolean,
) =>
  StyleSheet.create({
    container: {
      position: "relative",
      flex: 1,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? Colors.darkGray : Colors.lightGray,
      borderRadius: 8,
      overflow: "hidden",
    },
    content: {
      flex: 1,
      justifyContent: "space-between",
      gap: compact ? 10 : 14,
      padding: compact ? 14 : 18,
      paddingBottom: isEditing ? 60 : compact ? 14 : 18,
    },
    iconWrap: {
      alignItems: "center",
      justifyContent: "center",
      width: compact ? 42 : 48,
      height: compact ? 42 : 48,
      borderRadius: compact ? 12 : 14,
    },
    copy: {
      flex: 1,
      justifyContent: "center",
      gap: 4,
    },
    title: {
      fontFamily: Fonts.SEMIBOLD,
      fontSize: compact ? 19 : 22,
      color: isDark ? Colors.white : Colors.black,
    },
    description: {
      fontFamily: Fonts.REGULAR,
      fontSize: compact ? 12 : 14,
      lineHeight: compact ? 16 : 19,
      color: isDark ? Colors.lightGray : Colors.darkGray,
    },
    action: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 11,
      paddingVertical: 7,
      borderRadius: 8,
      backgroundColor: isDark ? Colors.white : Colors.black,
    },
    actionText: {
      fontFamily: Fonts.SEMIBOLD,
      fontSize: 13,
      color: isDark ? Colors.black : Colors.white,
    },
  });
