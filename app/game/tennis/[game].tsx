import { useLocalSearchParams, useNavigation } from "expo-router";
import { goBack } from "expo-router/build/global-state/routing";
import { useLayoutEffect, useMemo } from "react";
import { ScrollView, Text, View } from "react-native";

import MatchInformation from "@/components/Sports/Tennis/GameDetails/MatchInformation";
import GameHeader from "@/components/Sports/Tennis/GamePreview/GameHeader";
import { useScrollFade } from "@/hooks/useScrollFade";
import { gameDetailsScreenStyles } from "@/styles/GameDetailStyles/GameDetailsScreenStyles";
import { formatDate, formatTime, safeDate } from "@/utils/dateUtils";
import { getBroadcastDisplay } from "@/utils/games";
import { CustomHeader } from "components/CustomHeader";
import { Colors, Fonts } from "constants/styles";
import { usePreferences } from "contexts/PreferencesContext";
import type { TennisMatch } from "types/tennis/tennis";

type RouteParams = {
  game?: string | string[];
  data?: string | string[];
};

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function parseMatch(value?: string | string[]): TennisMatch | null {
  const raw = firstParam(value);
  if (!raw) return null;

  try {
    const decoded = decodeURIComponent(raw);
    return decoded.startsWith("{")
      ? (JSON.parse(decoded) as TennisMatch)
      : null;
  } catch {
    return null;
  }
}

export default function TennisMatchDetailsScreen() {
  const params = useLocalSearchParams<RouteParams>();
  const navigation = useNavigation();
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const match = useMemo(
    () => parseMatch(params.data) ?? parseMatch(params.game),
    [params.data, params.game],
  );
  const styles = gameDetailsScreenStyles;

  const { handleScrollStart, handleScrollEnd } = useScrollFade();

  const gameDate = safeDate(match?.date);
  const formattedDate = formatDate(gameDate);
  const formattedTime = formatTime(gameDate);

  const headline = match?.tournamentShortName;
  const broadcast = getBroadcastDisplay(match?.broadcasts);

  const round = match?.round.name ?? "";
  const division = match?.division.name ?? "";
  const court = match?.venue.court ?? "";
  const venue = match?.venue.name ?? "";
  const sets = match?.format.bestOf
    ? `Best of ${match?.format.bestOf} sets`
    : null;

  const competitors = match?.competitors.slice(0, 2);
  const leftCompetitor = competitors?.[0];
  const rightCompetitor = competitors?.[1];

  const leftCompetitorId = leftCompetitor?.id ?? "";
  const rightCompetitorId = rightCompetitor?.id ?? "";

  const leftCompetitorName = leftCompetitor?.shortName ?? "";
  const rightCompetitorName = rightCompetitor?.shortName ?? "";

  const leftCompetitorCountry = leftCompetitor?.country ?? "";
  const rightCompetitorCountry = rightCompetitor?.country ?? "";

  const leftCompetitorFlag = leftCompetitor?.flag ?? "";
  const rightCompetitorFlag = rightCompetitor?.flag ?? "";

  const leftCompetitorFlags = leftCompetitor?.flags ?? [];
  const rightCompetitorFlags = rightCompetitor?.flags ?? [];

  const state = match?.status.state ?? "";
  const gameStatusDescription = match?.status.description ?? "";
  const gameStatusDetail = match?.status.detail ?? "";

  const leftCompetitorScore = leftCompetitor?.score ?? null;
  const rightCompetitorScore = rightCompetitor?.score ?? null;

  const leftCompetitorServing = leftCompetitor?.serving ?? false;
  const rightCompetitorServing = rightCompetitor?.serving ?? false;

  const leftCompetitorWins = leftCompetitor?.winner ?? false;
  const rightCompetitorWins = rightCompetitor?.winner ?? false;

  const leftCompetitorRank = leftCompetitor?.rank ?? null;
  const rightCompetitorRank = rightCompetitor?.rank ?? null;

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <CustomHeader
          tabName={match?.tournamentShortName ?? "Tennis"}
          onBack={goBack}
        />
      ),
    });
  }, [match?.tournamentShortName, navigation]);

  if (!match) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          backgroundColor: isDark
            ? Colors.dark.background
            : Colors.light.background,
        }}
      >
        <Text
          selectable
          style={{
            color: isDark ? Colors.white : Colors.black,
            fontFamily: Fonts.MEDIUM,
            fontSize: 18,
            textAlign: "center",
          }}
        >
          Match details are unavailable.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      onScrollBeginDrag={handleScrollStart}
      onMomentumScrollEnd={handleScrollEnd}
      onScrollEndDrag={handleScrollEnd}
      stickyHeaderIndices={[0]}
    >
      <GameHeader
        headline={headline}
        leftCompetitorId={leftCompetitorId}
        leftCompetitorName={leftCompetitorName}
        leftCompetitorCountry={leftCompetitorCountry}
        leftCompetitorFlag={leftCompetitorFlag}
        leftCompetitorFlags={leftCompetitorFlags}
        leftCompetitorRank={leftCompetitorRank}
        leftCompetitorScore={leftCompetitorScore}
        leftCompetitorWins={leftCompetitorWins}
        leftCompetitorServing={leftCompetitorServing}
        rightCompetitorId={rightCompetitorId}
        rightCompetitorName={rightCompetitorName}
        rightCompetitorCountry={rightCompetitorCountry}
        rightCompetitorFlag={rightCompetitorFlag}
        rightCompetitorFlags={rightCompetitorFlags}
        rightCompetitorRank={rightCompetitorRank}
        rightCompetitorScore={rightCompetitorScore}
        rightCompetitorWins={rightCompetitorWins}
        rightCompetitorServing={rightCompetitorServing}
        date={formattedDate}
        time={formattedTime}
        broadcast={broadcast}
        state={state}
        gameStatusDetail={gameStatusDetail}
        gameStatusDescription={gameStatusDescription}
        isDark={isDark}
      />

      <View style={styles.innerContainer}>
        <MatchInformation
          sets={sets}
          division={division}
          round={round}
          court={court}
          venue={venue}
          isDark={isDark}
        />
      </View>
    </ScrollView>
  );
}
