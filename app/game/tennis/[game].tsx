import { useLocalSearchParams, useNavigation } from "expo-router";
import { goBack } from "expo-router/build/global-state/routing";
import { useLayoutEffect, useMemo } from "react";
import { ScrollView, Text, View } from "react-native";

import { CustomHeader } from "components/CustomHeader";
import TennisGameCard from "components/Sports/Tennis/Games/TennisGameCard";
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

function DetailRow({
  label,
  value,
  isDark,
}: {
  label: string;
  value?: string | number | null;
  isDark: boolean;
}) {
  if (value === null || value === undefined || value === "") return null;

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 20,
        paddingVertical: 9,
      }}
    >
      <Text
        selectable
        style={{
          color: isDark ? Colors.lightGray : Colors.darkGray,
          fontFamily: Fonts.REGULAR,
          fontSize: 14,
        }}
      >
        {label}
      </Text>
      <Text
        selectable
        style={{
          flex: 1,
          color: isDark ? Colors.white : Colors.black,
          fontFamily: Fonts.MEDIUM,
          fontSize: 14,
          textAlign: "right",
        }}
      >
        {value}
      </Text>
    </View>
  );
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

  const cardBackground = isDark
    ? Colors.dark.itemBackground
    : Colors.light.itemBackground;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 12, paddingBottom: 36, gap: 14 }}
      style={{
        flex: 1,
        backgroundColor: isDark
          ? Colors.dark.background
          : Colors.light.background,
      }}
    >
      <TennisGameCard match={match} variant="stacked" interactive={false} />

      <View
        style={{
          padding: 14,
          borderRadius: 12,
          borderCurve: "continuous",
          backgroundColor: cardBackground,
        }}
      >
        <Text
          selectable
          style={{
            color: isDark ? Colors.white : Colors.black,
            fontFamily: Fonts.BOLD,
            fontSize: 18,
            paddingBottom: 4,
          }}
        >
          Match information
        </Text>
        <DetailRow
          label="Tour"
          value={match.league.toUpperCase()}
          isDark={isDark}
        />
        <DetailRow label="Draw" value={match.division.name} isDark={isDark} />
        <DetailRow label="Round" value={match.round.name} isDark={isDark} />
        <DetailRow
          label="Format"
          value={
            match.format.bestOf ? `Best of ${match.format.bestOf} sets` : null
          }
          isDark={isDark}
        />
        <DetailRow label="Court" value={match.venue.court} isDark={isDark} />
        <DetailRow label="Venue" value={match.venue.name} isDark={isDark} />
        <DetailRow label="Broadcast" value={match.broadcast} isDark={isDark} />
      </View>

      {match.note ? (
        <View
          style={{
            padding: 14,
            borderRadius: 12,
            borderCurve: "continuous",
            backgroundColor: cardBackground,
          }}
        >
          <Text
            selectable
            style={{
              color: isDark ? Colors.white : Colors.black,
              fontFamily: Fonts.BOLD,
              fontSize: 18,
              paddingBottom: 6,
            }}
          >
            Match summary
          </Text>
          <Text
            selectable
            style={{
              color: isDark ? Colors.lightGray : Colors.darkGray,
              fontFamily: Fonts.REGULAR,
              fontSize: 14,
              lineHeight: 21,
            }}
          >
            {match.note}
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}
