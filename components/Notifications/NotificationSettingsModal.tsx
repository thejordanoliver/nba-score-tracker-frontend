import { snapPoints } from "@/utils/modalUtils";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { Colors, Fonts, activeOpacity } from "constants/styles";
import { usePreferences } from "contexts/PreferencesContext";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import type { NotificationTeamSport } from "types/notifications";
import {
  DISABLED_NOTIFICATION_EVENT_SETTINGS,
  type NotificationEventSettings,
} from "utils/notification-settings";

type NotificationSettingsModalProps = {
  visible: boolean;
  scope: "team" | "game";
  sport: NotificationTeamSport;
  league: string;
  enabled: boolean;
  settings: NotificationEventSettings;
  hasGameOverride?: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSave: (
    settings: NotificationEventSettings,
    enabled: boolean,
  ) => Promise<void>;
  onUseTeamDefaults?: () => Promise<void>;
};

type SettingKey = keyof NotificationEventSettings;

type SettingOption = {
  key: SettingKey;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const COMMON_OPTIONS: SettingOption[] = [
  {
    key: "gameStartEnabled",
    label: "Game starting",
    description: "Get an alert shortly before the game begins.",
    icon: "play-circle-outline",
  },
  {
    key: "closeGameEnabled",
    label: "Close game",
    description: "Get an alert when the game is close late.",
    icon: "flame-outline",
  },
  {
    key: "finalScoreEnabled",
    label: "Final score",
    description: "Get the result when the game ends.",
    icon: "checkmark-circle-outline",
  },
];

function getOptions(
  sport: NotificationTeamSport,
  league: string,
): SettingOption[] {
  const options = [...COMMON_OPTIONS];

  if (sport === "football") {
    options.splice(
      1,
      0,
      {
        key: "touchdownEnabled",
        label: "Touchdowns",
        description: "Get an alert after either team scores a touchdown.",
        icon: "american-football-outline",
      },
      {
        key: "quarterEndEnabled",
        label: "End of quarter",
        description: "Get the score after each quarter.",
        icon: "time-outline",
      },
      {
        key: "halftimeEnabled",
        label: "Halftime",
        description: "Get the score at halftime.",
        icon: "pause-circle-outline",
      },
    );
  } else if (sport === "basketball") {
    const periodOptions: SettingOption[] = [];
    if (league.toLowerCase() !== "cbb") {
      periodOptions.push({
        key: "quarterEndEnabled",
        label: "End of quarter",
        description: "Get the score after each quarter.",
        icon: "time-outline",
      });
    }
    periodOptions.push({
      key: "halftimeEnabled",
      label: "Halftime",
      description: "Get the score at halftime.",
      icon: "pause-circle-outline",
    });
    options.splice(1, 0, ...periodOptions);
  }

  return options;
}

export default function NotificationSettingsModal({
  visible,
  scope,
  sport,
  league,
  enabled,
  settings,
  hasGameOverride = false,
  isSaving,
  onClose,
  onSave,
  onUseTeamDefaults,
}: NotificationSettingsModalProps) {
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = useMemo(() => createStyles(isDark), [isDark]);
  const sheetRef = useRef<BottomSheetModal>(null);
  const [masterEnabled, setMasterEnabled] = useState(enabled);
  const [draft, setDraft] = useState(settings);
  const [saveError, setSaveError] = useState<string | null>(null);
  const options = useMemo(() => getOptions(sport, league), [league, sport]);

  useEffect(() => {
    if (!visible) {
      sheetRef.current?.dismiss();
      return;
    }

    const timeout = setTimeout(() => sheetRef.current?.present(), 0);
    return () => clearTimeout(timeout);
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  );

  const toggleSetting = useCallback((key: SettingKey, value: boolean) => {
    setDraft((current) => ({ ...current, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    const nextSettings = masterEnabled
      ? draft
      : DISABLED_NOTIFICATION_EVENT_SETTINGS;
    setSaveError(null);
    try {
      await onSave(nextSettings, masterEnabled);
    } catch (caught) {
      setSaveError(
        caught instanceof Error
          ? caught.message
          : "Could not save notification settings.",
      );
    }
  }, [draft, masterEnabled, onSave]);

  const handleUseTeamDefaults = useCallback(async () => {
    if (!onUseTeamDefaults) return;
    setSaveError(null);
    try {
      await onUseTeamDefaults();
    } catch (caught) {
      setSaveError(
        caught instanceof Error
          ? caught.message
          : "Could not restore team notification settings.",
      );
    }
  }, [onUseTeamDefaults]);

  const scopeCopy =
    scope === "team"
      ? "These choices apply to every game on this team's schedule."
      : hasGameOverride
        ? "Custom settings for this game override both teams' schedule settings."
        : "Save to create custom settings for this game. Until then, team schedule settings apply.";

  return (
    <BottomSheetModal
      ref={sheetRef}
      index={1}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enablePanDownToClose={!isSaving}
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons
              name="notifications-outline"
              size={22}
              color={isDark ? Colors.white : Colors.black}
            />
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>
              {scope === "team" ? "Team notifications" : "Game notifications"}
            </Text>
            <Text style={styles.subtitle}>{scopeCopy}</Text>
          </View>
        </View>

        <BottomSheetScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={[styles.row, styles.masterRow]}>
            <View style={styles.rowCopy}>
              <Text style={styles.rowTitle}>Notifications</Text>
              <Text style={styles.rowDescription}>
                {masterEnabled
                  ? "Choose which updates you want."
                  : "All updates are off."}
              </Text>
            </View>
            <Switch
              value={masterEnabled}
              onValueChange={setMasterEnabled}
              disabled={isSaving}
              trackColor={{ false: Colors.midTone, true: Colors.light.blue }}
              thumbColor={Colors.white}
              accessibilityLabel="Enable notifications"
            />
          </View>

          <Text style={styles.sectionLabel}>UPDATES</Text>
          <View style={styles.optionsCard}>
            {options.map((option, index) => (
              <View
                key={option.key}
                style={[
                  styles.row,
                  index < options.length - 1 && styles.rowDivider,
                  !masterEnabled && styles.disabledRow,
                ]}
              >
                <Ionicons
                  name={option.icon}
                  size={22}
                  color={isDark ? Colors.lightGray : Colors.darkGray}
                  style={styles.rowIcon}
                />
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle}>{option.label}</Text>
                  <Text style={styles.rowDescription}>
                    {option.description}
                  </Text>
                </View>
                <Switch
                  value={draft[option.key]}
                  onValueChange={(value) => toggleSetting(option.key, value)}
                  disabled={!masterEnabled || isSaving}
                  trackColor={{
                    false: Colors.midTone,
                    true: Colors.light.blue,
                  }}
                  thumbColor={Colors.white}
                  accessibilityLabel={option.label}
                />
              </View>
            ))}
          </View>

          <Pressable
            onPress={() => void handleSave()}
            disabled={isSaving}
            style={({ pressed }) => [
              styles.saveButton,
              pressed && styles.pressed,
              isSaving && styles.saving,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Save notification settings"
          >
            {isSaving ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.saveButtonText}>Save preferences</Text>
            )}
          </Pressable>

          {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}

          {scope === "game" && hasGameOverride && onUseTeamDefaults ? (
            <Pressable
              onPress={() => void handleUseTeamDefaults()}
              disabled={isSaving}
              style={({ pressed }) => [
                styles.defaultsButton,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Use team notification settings for this game"
            >
              <Text style={styles.defaultsButtonText}>Use team settings</Text>
            </Pressable>
          ) : null}
        </BottomSheetScrollView>
      </View>
    </BottomSheetModal>
  );
}

const createStyles = (isDark: boolean) => {
  const textColor = isDark ? Colors.white : Colors.black;
  const mutedColor = isDark ? Colors.lightGray : Colors.darkGray;
  const cardColor = isDark
    ? Colors.dark.itemBackground
    : Colors.light.itemBackground;

  return StyleSheet.create({
    sheetBackground: {
      backgroundColor: isDark ? Colors.black : Colors.white,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
    },
    handleIndicator: { backgroundColor: Colors.midTone, width: 38 },
    container: { flex: 1, paddingHorizontal: 16 },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      paddingTop: 8,
      paddingBottom: 16,
    },
    headerIcon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: cardColor,
    },
    headerCopy: { flex: 1 },
    title: { color: textColor, fontFamily: Fonts.SEMIBOLD, fontSize: 22 },
    subtitle: {
      color: mutedColor,
      fontFamily: Fonts.REGULAR,
      fontSize: 14,
      lineHeight: 19,
      marginTop: 2,
    },
    content: { paddingBottom: 40 },
    sectionLabel: {
      color: mutedColor,
      fontFamily: Fonts.MEDIUM,
      fontSize: 12,
      letterSpacing: 0.7,
      marginTop: 18,
      marginBottom: 8,
      marginLeft: 4,
    },
    optionsCard: {
      backgroundColor: cardColor,
      borderRadius: 16,
      overflow: "hidden",
    },
    row: {
      minHeight: 72,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    masterRow: { backgroundColor: cardColor, borderRadius: 16 },
    rowDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? Colors.darkGray : Colors.lightGray,
    },
    rowIcon: { marginRight: 12 },
    rowCopy: { flex: 1, paddingRight: 12 },
    rowTitle: { color: textColor, fontFamily: Fonts.MEDIUM, fontSize: 16 },
    rowDescription: {
      color: mutedColor,
      fontFamily: Fonts.REGULAR,
      fontSize: 13,
      lineHeight: 17,
      marginTop: 2,
    },
    disabledRow: { opacity: 0.48 },
    saveButton: {
      height: 50,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: Colors.light.blue,
      marginTop: 20,
    },
    saveButtonText: {
      color: Colors.white,
      fontFamily: Fonts.SEMIBOLD,
      fontSize: 16,
    },
    defaultsButton: {
      height: 48,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 6,
    },
    defaultsButtonText: {
      color: Colors.light.blue,
      fontFamily: Fonts.MEDIUM,
      fontSize: 16,
    },
    errorText: {
      color: isDark ? Colors.dark.lightRed : Colors.light.red,
      fontFamily: Fonts.REGULAR,
      fontSize: 13,
      marginTop: 10,
      textAlign: "center",
    },
    pressed: { opacity: activeOpacity },
    saving: { opacity: 0.65 },
  });
};
