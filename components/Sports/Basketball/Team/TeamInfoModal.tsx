import ChampionshipBanner from "@/components/Sports/Basketball/Team/ChampionshipBanner";
import { usePreferences } from "@/contexts/PreferencesContext";
import { TeamDetails } from "@/hooks/useTeams";
import { snapPoints } from "@/utils/modalUtils";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { Colors, Fonts } from "constants/styles";
import { useCallback, useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TeamInfo from "./TeamInfo";

type Props = {
  teamDetails: TeamDetails | null;
  visible: boolean;
  onClose: () => void;
  coach?: string;
  teamHistory?: string;
  teamId?: string | number;
  teamLogo?: any;
  league: string;
};

export default function TeamInfoModal({
  teamDetails,
  visible,
  onClose,
  teamId,
  teamLogo,
  league,
}: Props) {
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetModal>(null);
  const isPresentedRef = useRef(false);
  const styles = TeamInfoModalStyles(isDark, insets);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
      />
    ),
    [],
  );

  useEffect(() => {
    if (visible) {
      const timeout = setTimeout(() => {
        isPresentedRef.current = true;
        sheetRef.current?.present();
      }, 0);

      return () => clearTimeout(timeout);
    }

    if (isPresentedRef.current) {
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  const handleDismiss = useCallback(() => {
    isPresentedRef.current = false;
    onClose();
  }, [onClose]);

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      index={1}
      onDismiss={handleDismiss}
      enablePanDownToClose
      enableDynamicSizing={false}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.backgroundStyle}
      handleStyle={styles.handleStyle}
      handleIndicatorStyle={styles.handleIndicatorStyle}
    >
      <View style={styles.container}>
        {teamDetails?.name && (
          <Text
            style={styles.teamName}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.5}
          >
            {teamDetails.name}
          </Text>
        )}

        <BottomSheetScrollView
          contentContainerStyle={styles.contentContainerStyle}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Championships</Text>

          <ChampionshipBanner
            championships={teamDetails?.championships}
            teamName={teamDetails?.name ?? teamDetails?.shortName}
            teamLogo={teamLogo}
            teamId={teamId}
            league={league}
          />

          <TeamInfo
            teamId={teamId}
            teamDetails={teamDetails ?? null}
            league={league}
          />
        </BottomSheetScrollView>
      </View>
    </BottomSheetModal>
  );
}

export const TeamInfoModalStyles = (isDark: boolean, insets: any) =>
  StyleSheet.create({
    backgroundStyle: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      overflow: "hidden",
      backgroundColor: isDark ? Colors.black : Colors.white,
    },
    handleStyle: {
      position: "absolute",
      top: 0,
      right: 8,
      left: 8,
      alignItems: "center",
      justifyContent: "center",
      height: 40,
      backgroundColor: "transparent",
    },
    handleIndicatorStyle: {
      zIndex: 9999,
      width: 36,
      height: 4,
      marginBottom: 4,
      borderRadius: 2,
      backgroundColor: Colors.midTone,
    },
    container: {
      flex: 1,
      padding: 12,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      overflow: "hidden",
    },
    blurViewContainer: {
      flex: 1,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },

    contentContainerStyle: {
      paddingTop: 20,
      paddingBottom: 40,
    },
    teamName: {
      paddingBottom: 12,
      paddingTop: Math.max(insets?.top - 20, 12),
      fontFamily: Fonts.SEMIBOLD,
      fontSize: 20,
      color: isDark ? Colors.white : Colors.black,
      textAlign: "center",
    },
    sectionTitle: {
      marginBottom: 8,
      paddingBottom: 4,
      borderBottomWidth: 0.5,
      borderBottomColor: isDark ? Colors.lightGray : Colors.darkGray,
      fontFamily: Fonts.MEDIUM,
      fontSize: 20,
      color: isDark ? Colors.white : Colors.black,
      textAlign: "center",
    },
  });
