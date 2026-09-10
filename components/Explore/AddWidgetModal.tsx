import { LEAGUE_CONFIG } from "@/constants/leagues";
import { snapPoints } from "@/utils/modalUtils";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import type { ExploreWidgetOption } from "constants/exploreWidgets";
import {
  EXPLORE_WIDGET_OPTIONS,
  getDefaultWidgetSize,
} from "constants/exploreWidgets";
import { Colors, Fonts, activeOpacity } from "constants/styles";
import { Image } from "expo-image";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ExploreWidgetConfig,
  ExploreWidgetSize,
  ExploreWidgetType,
} from "types/widgets";

type AddWidgetModalProps = {
  visible: boolean;
  isDark: boolean;
  selectedWidgets: ExploreWidgetConfig[];
  onClose: () => void;
  onAddWidget: (
    type: ExploreWidgetType,
    title: string,
    size: ExploreWidgetSize,
  ) => void;
};

type WidgetCatalogCardProps = {
  option: ExploreWidgetOption;
  isDark: boolean;
  isSelected: boolean;
  styles: ReturnType<typeof addWidgetModalStyles>;
  onAddWidget: (
    type: ExploreWidgetType,
    title: string,
    size: ExploreWidgetSize,
  ) => void;
};

function WidgetCatalogCard({
  option,
  isDark,
  isSelected,
  styles,
  onAddWidget,
}: WidgetCatalogCardProps) {
  const defaultSize = getDefaultWidgetSize(option.type);

  const leagueConfig = option.league ? LEAGUE_CONFIG[option.league] : undefined;

  const leagueLogo = leagueConfig
    ? isDark
      ? leagueConfig.logoLight
      : leagueConfig.logo
    : undefined;

  return (
    <View style={[styles.card, isSelected && styles.cardSelected]}>
      {leagueLogo ? (
        <Image
          source={leagueLogo}
          style={styles.leagueLogo}
          contentFit="contain"
        />
      ) : (
        <Ionicons
          name={option.icon}
          size={22}
          color={isDark ? Colors.white : Colors.black}
        />
      )}

      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle}>{option.title}</Text>

          {option.badge && <Text style={styles.badge}>{option.badge}</Text>}
        </View>

        <Text style={styles.description}>{option.description}</Text>

        {option.sizes.length > 1 && !isSelected && (
          <View style={styles.sizeRow}>
            {option.sizes.map((size) => (
              <TouchableOpacity
                key={size}
                activeOpacity={activeOpacity}
                onPress={() => onAddWidget(option.type, option.title, size)}
                style={styles.sizeButton}
                accessibilityRole="button"
                accessibilityLabel={`Add ${option.title} ${size} widget`}
              >
                <Text style={styles.sizeButtonText}>
                  {size[0].toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.action}>
        {isSelected ? (
          <Ionicons
            name="checkmark-circle"
            size={24}
            color={isDark ? Colors.dark.leafGreen : Colors.light.green}
          />
        ) : (
          <TouchableOpacity
            activeOpacity={activeOpacity}
            onPress={() => onAddWidget(option.type, option.title, defaultSize)}
            style={styles.addButton}
            accessibilityRole="button"
            accessibilityLabel={`Add ${option.title} widget`}
          >
            <Text style={styles.addText}>Add</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function AddWidgetModal({
  visible,
  isDark,
  selectedWidgets,
  onClose,
  onAddWidget,
}: AddWidgetModalProps) {
  const styles = useMemo(() => addWidgetModalStyles(isDark), [isDark]);
  const sheetRef = useRef<BottomSheetModal>(null);
  const hasPresentedRef = useRef(false);
  const { top, bottom } = useSafeAreaInsets();
  const selectedSet = useMemo(
    () => new Set(selectedWidgets.map((widget) => widget.type)),
    [selectedWidgets],
  );

  useEffect(() => {
    if (!visible) {
      if (hasPresentedRef.current) {
        sheetRef.current?.dismiss();
      }

      return;
    }

    const frame = requestAnimationFrame(() => {
      hasPresentedRef.current = true;
      sheetRef.current?.present();
    });

    return () => cancelAnimationFrame(frame);
  }, [visible]);

  const handleDismiss = useCallback(() => {
    hasPresentedRef.current = false;
    onClose();
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={isDark ? 0.58 : 0.34}
        pressBehavior="close"
      />
    ),
    [isDark],
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      index={2}
      snapPoints={snapPoints}
      stackBehavior="push"
      topInset={top}
      enableDynamicSizing={false}
      enablePanDownToClose
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      handleStyle={styles.handle}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.sheetBackground}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Add Widget</Text>
            <Text style={styles.subtitle}>
              Tap Add or choose a size for your Explore dashboard.
            </Text>
          </View>
        </View>

        <BottomSheetScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.options,
            { paddingBottom: bottom + 24 },
          ]}
        >
          {EXPLORE_WIDGET_OPTIONS.map((option) => {
            const isSelected =
              option.allowDuplicates !== true && selectedSet.has(option.type);

            return (
              <WidgetCatalogCard
                key={option.type}
                option={option}
                isDark={isDark}
                isSelected={isSelected}
                styles={styles}
                onAddWidget={onAddWidget}
              />
            );
          })}
        </BottomSheetScrollView>
      </View>
    </BottomSheetModal>
  );
}

const addWidgetModalStyles = (isDark: boolean) =>
  StyleSheet.create({
    sheetBackground: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      backgroundColor: isDark ? Colors.black : Colors.white,
    },
    handle: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      backgroundColor: isDark ? Colors.black : Colors.white,
    },
    handleIndicator: {
      width: 38,
      backgroundColor: Colors.midTone,
    },
    container: {
      flex: 1,
      paddingHorizontal: 16,
      backgroundColor: isDark ? Colors.black : Colors.white,
    },

    headerText: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      marginBottom: 14,
    },

    title: {
      textAlign: "center",
      fontFamily: Fonts.BOLD,
      fontSize: 20,
      color: isDark ? Colors.white : Colors.black,
    },
    subtitle: {
      textAlign: "center",
      marginTop: 2,
      fontFamily: Fonts.REGULAR,
      fontSize: 14,
      color: isDark ? Colors.lightGray : Colors.darkGray,
    },
    options: {
      gap: 10,
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      minHeight: 88,
      padding: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? Colors.darkGray : Colors.lightGray,
    },
    cardSelected: {
      borderColor: isDark ? Colors.dark.leafGreen : Colors.light.green,
      opacity: 0.72,
    },

    leagueLogo: {
      width: 42,
      height: 42,
    },
    cardBody: {
      flex: 1,
      gap: 3,
    },
    titleRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 8,
    },
    cardTitle: {
      fontFamily: Fonts.MEDIUM,
      fontSize: 17,
      color: isDark ? Colors.white : Colors.black,
    },
    badge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      backgroundColor: isDark ? Colors.darkGray : Colors.white,
      overflow: "hidden",
      fontFamily: Fonts.MEDIUM,
      fontSize: 10,
      color: isDark ? Colors.white : Colors.black,
    },
    description: {
      fontFamily: Fonts.REGULAR,
      fontSize: 12,
      lineHeight: 16,
      color: isDark ? Colors.lightGray : Colors.darkGray,
    },
    action: {
      alignItems: "flex-end",
      minWidth: 46,
    },
    addButton: {
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 6,
      backgroundColor: isDark ? Colors.white : Colors.black,
    },
    addText: {
      fontFamily: Fonts.SEMIBOLD,
      fontSize: 13,
      color: isDark ? Colors.black : Colors.white,
    },
    sizeRow: {
      flexDirection: "row",
      gap: 6,
      marginTop: 8,
    },
    sizeButton: {
      alignItems: "center",
      justifyContent: "center",
      width: 30,
      height: 26,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? Colors.darkGray : Colors.lightGray,
      borderRadius: 6,
      backgroundColor: isDark ? Colors.black : Colors.white,
    },
    sizeButtonText: {
      fontFamily: Fonts.BOLD,
      fontSize: 12,
      color: isDark ? Colors.white : Colors.black,
    },
  });
