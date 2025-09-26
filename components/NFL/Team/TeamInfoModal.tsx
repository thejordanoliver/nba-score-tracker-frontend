// components/NFL/TeamInfoBottomSheetNFL.tsx
import ChampionshipBanner from "components/ChampionshipBanner";
import { getTeamInfo } from "constants/teamsNFL";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { BlurView } from "expo-blur";
import { useEffect, useMemo, useRef } from "react";
import { StyleSheet, Text, View, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TeamInfoCard from "./TeamInfoCard";
import { Fonts } from "constants/fonts";

type Props = {
  visible: boolean;
  onClose: () => void;
  teamId?: string | number;
};

export default function TeamInfoBottomSheetNFL({ visible, onClose, teamId }: Props) {
  const isDark = useColorScheme() === "dark";
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetModal>(null);

const team = teamId ? getTeamInfo(teamId) : undefined;

  useEffect(() => {
    if (visible) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [visible]);

  const snapPoints = useMemo(() => ["60%", "92%"], []);

  return (
    <BottomSheetModal
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      onDismiss={onClose}
      enablePanDownToClose
      enableDynamicSizing={false}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          pressBehavior="close"
        />
      )}
      backgroundStyle={{ backgroundColor: "transparent" }}
      handleStyle={{
        backgroundColor: "transparent",
        paddingTop: 12,
        alignItems: "center",
        position: "absolute",
        left: 0,
        right: 0,
      }}
      handleIndicatorStyle={{
        backgroundColor: team?.color,
        width: 36,
        height: 4,
        borderRadius: 2,
      }}
    >
      <View
        style={{
          flex: 1,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          overflow: "hidden",
        }}
      >
        <BlurView
          intensity={100}
          tint={"systemThinMaterial"}
          style={StyleSheet.absoluteFill}
        />

        <View style={{ paddingHorizontal: 12, flex: 1 }}>
          {team?.name && (
            <Text
              style={{
                fontFamily: Fonts.OSSEMIBOLD,
                fontSize: 20,
                paddingTop: insets.top - 20,
                paddingBottom: 12,
                color: isDark ? "#fff" : "#1d1d1d",
                textAlign: "center",
              }}
            >
              {team.name}
            </Text>
          )}

          <BottomSheetScrollView
            contentContainerStyle={{ paddingTop: 20, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            <Text
              style={{
                textAlign: "center",
                fontSize: 20,
                fontFamily: Fonts.OSMEDIUM,
                marginBottom: 8,
                paddingBottom: 4,
                borderBottomWidth: 0.5,
                borderBottomColor: isDark ? "#ccc" : "#444",
                color: isDark ? "#fff" : "#1d1d1d",
              }}
            >
             Super Bowls
            </Text>

            <ChampionshipBanner
              years={[]} // you can expand constants later
              logo={team?.logo}
              teamName={team?.name}
              teamId={team?.id}
                league="NFL" // 👈 add this
            />

            <TeamInfoCard teamId={teamId} />
          </BottomSheetScrollView>
        </View>
      </View>
    </BottomSheetModal>
  );
}
