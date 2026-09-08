import { Ionicons } from "@expo/vector-icons";
import { Colors, activeOpacity } from "constants/styles";
import { TouchableOpacity, useWindowDimensions, View } from "react-native";
import { customHeaderStyles } from "../../styles/CustomHeaderStyles";

type HeaderLeftActionsProps = {
  tabName?: string;
  showBackButton: boolean;
  onBack?: () => void;
  onAddWidget?: () => void;
  onToggleWidgetEditing?: () => void;
  isWidgetEditing?: boolean;
  onProfileMessages?: () => void;
  isDark: boolean;
  headerIconColor: string;
};

export function HeaderLeftActions({
  tabName,
  showBackButton,
  onBack,
  onAddWidget,
  onToggleWidgetEditing,
  isWidgetEditing = false,
  onProfileMessages,
  isDark,
  headerIconColor,
}: HeaderLeftActionsProps) {
  const { width } = useWindowDimensions();
  const styles = customHeaderStyles(isDark, width);

  if (tabName === "Profile") {
    return onProfileMessages ? (
      <TouchableOpacity
        activeOpacity={activeOpacity}
        onPress={onProfileMessages}
        style={styles.profileHeaderActionButton}
        hitSlop={8}
      >
        <Ionicons
          name="chatbubbles-outline"
          size={24}
          color={isDark ? Colors.white : Colors.black}
        />
      </TouchableOpacity>
    ) : (
      <View style={styles.profileHeaderPlaceholder} />
    );
  }

  if (showBackButton && onBack) {
    return (
      <TouchableOpacity
        activeOpacity={activeOpacity}
        onPress={onBack}
        hitSlop={8}
      >
        <Ionicons name="arrow-back" size={24} color={headerIconColor} />
      </TouchableOpacity>
    );
  }

  if (tabName === "Explore" && (onAddWidget || onToggleWidgetEditing)) {
    return (
      <View style={styles.exploreHeaderActions}>
        {onAddWidget && (
          <TouchableOpacity
            activeOpacity={activeOpacity}
            onPress={onAddWidget}
            style={styles.exploreHeaderActionButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Add widget"
          >
            <Ionicons
              name="add"
              size={23}
              color={isDark ? Colors.white : Colors.black}
            />
          </TouchableOpacity>
        )}

        {onToggleWidgetEditing && (
          <TouchableOpacity
            activeOpacity={activeOpacity}
            onPress={onToggleWidgetEditing}
            style={[
              styles.exploreHeaderActionButton,
              isWidgetEditing && styles.exploreHeaderActionButtonSelected,
            ]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={
              isWidgetEditing ? "Finish editing widgets" : "Edit widgets"
            }
            accessibilityState={{ selected: isWidgetEditing }}
          >
            <Ionicons
              name={isWidgetEditing ? "checkmark" : "create-outline"}
              size={21}
              color={
                isWidgetEditing
                  ? isDark
                    ? Colors.black
                    : Colors.white
                  : isDark
                    ? Colors.white
                    : Colors.black
              }
            />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return <View style={styles.headerSidePlaceholder} />;
}
