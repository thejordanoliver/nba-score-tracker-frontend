import { summerGame } from "types/types";
import CoxPavilionArena from "../../../assets/Arenas/CoxPavilion.webp";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { goBack } from "expo-router/build/global-state/routing";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { ScrollView, Text, useColorScheme, View } from "react-native";

import SaltLakeArena from "../../../assets/Arenas/SaltLakeArena.webp";
import VegasArena from "../../../assets/Arenas/VegasSummerLeagueArena.webp";
import { CustomHeaderTitle } from "../../../components/CustomHeaderTitle";
import TeamLocationSection from "../../../components/GameDetails/TeamLocationSection";
import TeamLocationSkeleton from "../../../components/GameDetails/TeamLocationSkeleton";
import { GameInfo } from "../../../components/summer-league/GameInfo";
import LineScore from "../../../components/summer-league/LineScore";
import { TeamRow } from "../../../components/summer-league/TeamRow";
import { teams } from "../../../constants/teams";
import { useWeatherForecast } from "../../../hooks/useWeather";
import HistoricalOddsCard from "components/summer-league/HistoricalOddsCard";
import { useHistoricalOdds } from "hooks/useHistoricalOdds";
import HistoricalOddsCardSkeleton from "../../../components/summer-league/HistoricalOddsSkeleton";

const OSEXTRALIGHT = "Oswald_200ExtraLight";

export default function SummerLeagueGameDetails() {
  const { game } = useLocalSearchParams();
  const isDark = useColorScheme() === "dark";
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);

  if (typeof game !== "string") return null;

  const parsedGame: summerGame = JSON.parse(game);

  const homeTeamData = teams.find(
    (t) =>
      t.name === parsedGame.home.name ||
      t.code === parsedGame.home.name ||
      t.fullName === parsedGame.home.name
  );
  const awayTeamData = teams.find(
    (t) =>
      t.name === parsedGame.away.name ||
      t.code === parsedGame.away.name ||
      t.fullName === parsedGame.away.name
  );

  if (!homeTeamData || !awayTeamData) return null;

  const colors = useMemo(
    () => ({
      background: isDark ? "#1d1d1d" : "#fff",
      text: isDark ? "#fff" : "#000",
      secondaryText: isDark ? "#aaa" : "#444",
      record: isDark ? "#ccc" : "#555",
      score: isDark ? "#aaa" : "rgba(0, 0, 0, 0.4)",
      winnerScore: isDark ? "#fff" : "#000",
      border: isDark ? "#333" : "#ccc",
      finalText: isDark ? "#ff4c4c" : "#d10000",
    }),
    [isDark]
  );

  const {
    weather,
    loading: weatherLoading,
    error: weatherError,
  } = useWeatherForecast(
    homeTeamData.latitude ?? null,
    homeTeamData.longitude ?? null,
    parsedGame.date // ✅ This is already complete with time + timezone
  );

  // Access .long property here
  const homeIsWinner =
    ["Final", "Game Finished"].includes(parsedGame.status.long) &&
    (parsedGame.homeScore ?? 0) > (parsedGame.awayScore ?? 0);
  const awayIsWinner =
    ["Final", "Game Finished"].includes(parsedGame.status.long) &&
    (parsedGame.awayScore ?? 0) > (parsedGame.homeScore ?? 0);

  const gameStatusLong: string = parsedGame.status.long;

  const isFinalStatus = ["Final", "Game Finished"].includes(gameStatusLong);


const gameDate = new Date(parsedGame.date).toISOString().split("T")[0];
  const {
    data: historicalOdds,
    loading: oddsLoading,
    error: oddsError,
  } = useHistoricalOdds({
    date: gameDate,
    team1: awayTeamData.code,
    team2: homeTeamData.code,
  });
  

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <CustomHeaderTitle
          title={`${awayTeamData.code} vs ${homeTeamData.code}`}
          tabName="Game"
          onBack={goBack}
        />
      ),
    });
  }, [navigation, homeTeamData, awayTeamData, isDark]);

  useEffect(() => {
    const timeout = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timeout);
  }, []);

  const gameDateTime = new Date(parsedGame.date);

  const formattedDate = gameDateTime.toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
  });

  // --- NEW LOGIC START ---
  let quarterDisplay = "Live";

  if (
    typeof parsedGame.period === "number" &&
    parsedGame.status.long !== "Scheduled"
  ) {
    quarterDisplay = `Q${parsedGame.period}`;
  } else if (typeof parsedGame.period === "string") {
    quarterDisplay = parsedGame.period;
  }

  if (isFinalStatus) {
    quarterDisplay = "Final";
  }

  const formattedTime = gameDateTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const timeDisplay =
    parsedGame.status.long === "Not Started" ? formattedTime : quarterDisplay;

  function isSaltLakeCityGame(dateStr: string): boolean {
    const date = new Date(dateStr);
    const start = new Date("2025-07-05");
    const end = new Date("2025-07-09");
    return date >= start && date <= end;
  }

  // Determine arena info based on venue string (case-insensitive)
  const venueLower = parsedGame.venue?.toLowerCase() ?? "";

  let arenaImage = VegasArena;
  let arenaName = "Thomas & Mack Center";
  let location = "Las Vegas, NV";
  let address = "4505 S Maryland Pkwy, Las Vegas, NV 89154";
  let arenaCapacity = "17,923";

  if (venueLower.includes("cox pavilion")) {
    arenaImage = CoxPavilionArena;
    arenaName = "Cox Pavilion";
    location = "Las Vegas, NV";
    address = "3720 S Maryland Pkwy, Las Vegas, NV 89169"; // example address
    arenaCapacity = "2,500"; // example capacity
  } else if (venueLower.includes("thomas & mack center")) {
    arenaImage = VegasArena;
    arenaName = "Thomas & Mack Center";
    location = "Las Vegas, NV";
    address = "4505 S Maryland Pkwy, Las Vegas, NV 89154";
    arenaCapacity = "17,923";
  } else if (venueLower.includes("huntsman center")) {
    arenaImage = SaltLakeArena;
    arenaName = "Jon M. Huntsman Center";
    location = "Salt Lake City, UT";
    address = "1825 E. South Campus Dr, Salt Lake City, UT 84112";
    arenaCapacity = "15,000";
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
    >
      {/* Summer League Label */}
      <View style={{ alignItems: "center" }}>
        <Text
          style={{
            fontFamily: OSEXTRALIGHT,
            fontSize: 14,
            color: colors.text,
            opacity: 0.8,
          }}
        >
          Summer League
        </Text>
      </View>

      {/* Teams + Scores */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          borderBottomWidth: 1,
          borderColor: colors.border,
          paddingBottom: 12,
        }}
      >
        {/* Away Team */}
        <TeamRow
          team={{
            id: awayTeamData.id.toString(),
            name: parsedGame.away.name,
            logo:
              isDark && awayTeamData.logoLight
                ? awayTeamData.logoLight
                : awayTeamData.logo,
            code: awayTeamData.code,
          }}
          isDark={isDark}
          isHome={false}
          score={parsedGame.awayScore}
          isWinner={awayIsWinner}
          colors={colors}
        />

        <GameInfo
          status={
            isFinalStatus
              ? "Final"
              : parsedGame.clock && parsedGame.status.long !== "Not Started"
                ? "In Progress"
                : "Scheduled"
          }
          date={formattedDate}
          time={
            parsedGame.status.long === "Not Started"
              ? formattedTime
              : timeDisplay
          } // show actual start time only if not started
          period={
            typeof parsedGame.period === "number"
              ? `Q${parsedGame.period}`
              : parsedGame.period
          }
          clock={parsedGame.clock}
          colors={colors}
          isDark={isDark}
          homeTeam={parsedGame.home.name}
          awayTeam={parsedGame.away.name}
          isSummerLeague={true}
        />

        {/* Home Team */}
        <TeamRow
          team={{
            id: homeTeamData.id.toString(),
            name: parsedGame.home.name,
            logo:
              isDark && homeTeamData.logoLight
                ? homeTeamData.logoLight
                : homeTeamData.logo,
            code: homeTeamData.code,
          }}
          isDark={isDark}
          isHome={true}
          score={parsedGame.homeScore}
          isWinner={homeIsWinner}
          colors={colors}
        />
      </View>

  {oddsLoading ? (
        <View style={{ marginTop: 20 }}>
          {[...Array(1)].map((_, i) => (
            <HistoricalOddsCardSkeleton key={i} />
          ))}
        </View>
      ) : (
        historicalOdds.length > 0 && (
          <View style={{ marginTop: 20 }}>
            {historicalOdds.map((game) => (
              <HistoricalOddsCard key={game.id} game={game} />
            ))}
          </View>
        )
      )}
      {oddsError && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ color: "red" }}>Error loading odds: {oddsError}</Text>
        </View>
      )}

      {parsedGame.scores?.home && parsedGame.scores?.away && (
        <LineScore
          homeScores={parsedGame.scores.home}
          awayScores={parsedGame.scores.away}
          isDark={isDark}
          homeCode={homeTeamData.code}
          awayCode={awayTeamData.code}
        />
      )}

      {/* Arena & Weather Info */}
      {isLoading ? (
        <TeamLocationSkeleton />
      ) : (
        <TeamLocationSection
          arenaImage={arenaImage}
          arenaName={arenaName}
          location={location}
          address={address}
          arenaCapacity={arenaCapacity}
          weather={weather}
          loading={weatherLoading}
          error={weatherError}
        />
      )}
    </ScrollView>
  );
}
