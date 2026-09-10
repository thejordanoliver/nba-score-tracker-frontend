import { PlayerCard } from "@/components/Sports/Basketball/Player/PlayerCard";
import { globalStyles } from "@/constants/styles";
import { usePreferences } from "@/contexts/PreferencesContext";
import PlayerCardSkeletonList from "components/Skeletons/PlayerCardListSkeleton";
import { Leader } from "hooks/FootballHooks/useSeasonLeaders";
import { useEffect, useRef } from "react";
import { FlatList, Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { leadersListStyles } from "styles/LeagueStyles/LeadersListStyles";

import HeadingTwo from "../../Headings/HeadingTwo";
import { getCFBTeam } from "@/constants/teamsCFB";

interface Category {
  categoryName: string;
  abbreviation: string;
  shortName: string;
  leaders: Leader[];
}

interface SeasonLeadersListProps {
  loading?: boolean;
  error?: string | null;
  categories?: Category[];
  league: string;
}

export default function SeasonLeadersList({
  loading,
  error,
  league,
  categories = [],
}: SeasonLeadersListProps) {
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = leadersListStyles(isDark);
  const global = globalStyles(isDark);
  const cacheRef = useRef<
    Partial<Record<SeasonLeadersListProps["league"], Category[]>>
  >({});

  useEffect(() => {
    if (!categories?.length) return;

    cacheRef.current[league] = categories;
  }, [categories, league]);

  const isMLB = league === "mlb";

  if (loading) {
    return (
      <ScrollView contentContainerStyle={styles.skeletonList}>
        <PlayerCardSkeletonList />
      </ScrollView>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={global.errorText}>Failed to load stats: {error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={cacheRef.current[league] ?? categories}
      contentContainerStyle={styles.contentContainerStyle}
      keyExtractor={(item) => item.categoryName}
      renderItem={({ item }) => {
        if (!item.leaders || item.leaders.length === 0) {
          return null;
        }

        return (
          <View style={styles.categoryContainer}>
            <HeadingTwo isDark={isDark}>{item.categoryName} Leaders</HeadingTwo>

            <View style={styles.playersList}>
              {item.leaders.slice(0, 5).map((player) => {
                const team = getCFBTeam(player.team_id ?? player.teamId ?? 0);
                return (
                  <PlayerCard
                    key={player.id}
                    rank={player.rank}
                    id={Number(player.id)}
                    name={player.short_name}
                    position={player.position}
                    headshot={player.headshot_url}
                    statNumber={isMLB ? player.value : player.displayValue}
                    league={league}
                    teamId={team?.id ?? 0}
                  />
                );
              })}
            </View>
          </View>
        );
      }}
    />
  );
}
