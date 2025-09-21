import { teams } from "constants/teams";
import { usePreferences } from "contexts/PreferencesContext";
import { Game } from "types/types";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import { LongPressGestureHandler, State } from "react-native-gesture-handler";
import GamePreviewModal from "../GamePreview/GamePreviewModal";
import GameCard from "./GameCard";
import GameSquareCard from "./GameSquareCard";

type DummyGameCardProps = {
  isDark?: boolean;
  style?: object; // allow passing style if you use it like in grid mode
};

export default function DummyGameCard() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { viewMode } = usePreferences();

  const [previewGame, setPreviewGame] = useState<Game | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleLongPress = (game: Game) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPreviewGame(game);
    setModalVisible(true);
  };

  // Get teams by name
  const lakers = teams.find((t) => t.fullName === "Los Angeles Lakers");
  const warriors = teams.find((t) => t.fullName === "Golden State Warriors");
  const celtics = teams.find((t) => t.fullName === "Boston Celtics");
  const heat = teams.find((t) => t.fullName === "Miami Heat");
  const bucks = teams.find((t) => t.fullName === "Milwaukee Bucks");
  const suns = teams.find((t) => t.fullName === "Phoenix Suns");
  const knicks = teams.find((t) => t.fullName === "New York Knicks");
  const nuggets = teams.find((t) => t.fullName === "Denver Nuggets");

  if (
    !lakers ||
    !warriors ||
    !celtics ||
    !heat ||
    !bucks ||
    !suns ||
    !knicks ||
    !nuggets
  ) {
    return null;
  }

  const dummyGames: Game[] = [
    {
      id: 1,
      home: {
        id: warriors.id,
        name: warriors.name,
        logo: warriors.logo,
        record: "48-34",
      },
      away: {
        id: lakers.id,
        name: lakers.name,
        logo: lakers.logo,
        record: "47-35",
      },
      date: new Date(2024, 3, 14).toISOString(),
      time: "7:00 PM",
      status: "Final",
      clock: "",
      period: "4",
      homeScore: 112,
      awayScore: 101,
      isHalftime: false,
    },
    {
      id: 2,
      home: {
        id: celtics.id,
        name: celtics.name,
        logo: celtics.logo,
        record: "58-24",
      },
      away: {
        id: heat.id,
        name: heat.name,
        logo: heat.logo,
        record: "44-38",
      },
      date: new Date(2024, 3, 16).toISOString(),
      time: "8:00 PM",
      status: "Final",
      clock: "",
      period: "4",
      homeScore: 110,
      awayScore: 115,
      isHalftime: false,
    },
    {
      id: 3,
      home: {
        id: bucks.id,
        name: bucks.name,
        logo: bucks.logo,
        record: "51-31",
      },
      away: {
        id: suns.id,
        name: suns.name,
        logo: suns.logo,
        record: "49-33",
      },
      date: new Date(2024, 3, 19).toISOString(),
      time: "9:30 PM",
      status: "In Progress",
      clock: "0:05",
      periods: {
        current: 3,
        total: 4,
        endOfPeriod: false,
      },
      homeScore: 104,
      awayScore: 101,
      isHalftime: false,
    },
    {
      id: 4,
      home: {
        id: knicks.id,
        name: knicks.name,
        logo: knicks.logo,
        record: "45-37",
      },
      away: {
        id: nuggets.id,
        name: nuggets.name,
        logo: nuggets.logo,
        record: "53-29",
      },
      date: new Date(2024, 3, 21).toISOString(),
      time: "7:30 PM",
      status: "Scheduled",
      clock: "",
      period: "",
      homeScore: 0,
      awayScore: 0,
      isHalftime: false,
    },
  ];

  const renderGameCard = (game: Game) => (
    // <LongPressGestureHandler
    //   key={game.id}
    //   minDurationMs={300}
    //   onHandlerStateChange={({ nativeEvent }) => {
    //     if (nativeEvent.state === State.ACTIVE) {
    //       handleLongPress(game);
    //     }
    //   }}
    // >
      <View style={viewMode === "grid" ? styles.gridItem : undefined}>
        {viewMode === "list" ? (
          <GameCard game={game} isDark={isDark} />
        ) : (
          <GameSquareCard game={game} isDark={isDark} />
        )}
      </View>
    // {/* </LongPressGestureHandler> */}
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          viewMode === "grid" && styles.gridContainer,
        ]}
      >
        {dummyGames.map((game) => renderGameCard(game))}
      </ScrollView>

      {modalVisible && previewGame && (
        <GamePreviewModal
          visible={modalVisible}
          game={previewGame}
          onClose={() => setModalVisible(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    gap: 12,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridItem: {
    width: "48%",
  },
});
