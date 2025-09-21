import { Text, View } from "react-native";
import UpcomingOddsCard from "components/GameDetails/UpcomingOddsCard";
import HistoricalOddsCard from "components/GameDetails/HistoricalOddsCard";
import OddsSkeleton from "components/GameDetails/OddsSkeleton";
import { useUpcomingOdds } from "hooks/useUpcomingOdds";
import { useHistoricalOdds } from "hooks/useHistoricalOdds";

type GameOddsSectionProps = {
  date: string; // ISO date-time string
  gameDate: string; // YYYY-MM-DD
  homeCode: string;
  awayCode: string;
  gameId: string;
};

export default function GameOddsSection({
  date,
  gameDate,
  homeCode,
  awayCode,
  gameId,
}: GameOddsSectionProps) {
  // --- Upcoming odds ---
  const {
    data: upcomingOdds,
    loading: upcomingLoading,
    error: upcomingError,
  } = useUpcomingOdds({
    timestamp: date,
    team1: awayCode,
    team2: homeCode,
  });

  const hasUpcomingOdds =
    !upcomingLoading && !upcomingError && upcomingOdds.length > 0;

  // --- Historical odds (hook always called) ---
  const {
    data: historicalOdds,
    loading: oddsLoading,
    error: oddsError,
  } = useHistoricalOdds({
    date: gameDate,
    team1: awayCode,
    team2: homeCode,
    gameId,
    skip: hasUpcomingOdds, // ✅ pass skip flag to prevent fetching
  });

  return (
    <View style={{ marginTop: 20 }}>
      {/* --- Upcoming Odds --- */}
      {upcomingLoading ? (
        <OddsSkeleton />
      ) : upcomingError ? (
        <Text style={{ color: "red" }}>
          Error loading upcoming odds: {upcomingError}
        </Text>
      ) : hasUpcomingOdds ? (
        <View style={{ marginBottom: 20 }}>
          {upcomingOdds.map((game) => (
            <UpcomingOddsCard key={game.id} game={game} />
          ))}
        </View>
      ) : null}

      {/* --- Historical Odds (only if no upcoming) --- */}
      {!hasUpcomingOdds &&
        (oddsLoading ? (
          <OddsSkeleton />
        ) : oddsError ? (
          <Text style={{ color: "red" }}>{oddsError}</Text>
        ) : historicalOdds.length > 0 ? (
          <View>
            {historicalOdds.map((game) => (
              <HistoricalOddsCard key={game.id} game={game} />
            ))}
          </View>
        ) : null)}
    </View>
  );
}
