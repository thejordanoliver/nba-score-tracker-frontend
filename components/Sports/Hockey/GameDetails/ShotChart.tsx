import Dropdown from "@/components/Dropdown";
import type { Play } from "@/hooks/HockeyHooks/useHockeyGameDetails";
import rinkImage from "assets/Placeholders/NHLRinkPlaceholder.png";

import { getNHLTeam, getNHLTeamLogo } from "@/constants/teamsNHL";
import HeadingTwo from "components/Headings/HeadingTwo";
import { Colors, Fonts } from "constants/styles";
import { usePreferences } from "contexts/PreferencesContext";
import React, { useMemo, useState } from "react";
import { Image, LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

interface ShotChartProps {
  plays?: Play[];
  homeId: string | number;
  awayId: string | number;
  homeEspnId: string | number;
  awayEspnId: string | number;
  homeColor: string;
  awayColor: string;
  homeLogo: any;
  awayLogo: any;
  league: string;
  neutralSite?: boolean;
  state: string | null;
}

type ShotChartTab =
  | "All"
  | "1st"
  | "2nd"
  | "3rd"
  | "4th"
  | "1st Half"
  | "2nd Half";

type ShotEventFilter = "All Events" | "Goals" | "Blocked Shots";

const RINK_LENGTH = 200;
const RINK_WIDTH = 85;
const RINK_HALF_LENGTH = 100;
const RINK_HALF_WIDTH = 42.5;
const RINK_ASSET_WIDTH = 1976;
const RINK_ASSET_HEIGHT = 963;
const RINK_ASSET_BOUNDS = {
  left: 63,
  top: 64,
  right: 1911,
  bottom: 899,
};
const RINK_VIEWBOX_BOUNDS = {
  left: (RINK_ASSET_BOUNDS.left / RINK_ASSET_WIDTH) * RINK_LENGTH,
  top: (RINK_ASSET_BOUNDS.top / RINK_ASSET_HEIGHT) * RINK_WIDTH,
  right: (RINK_ASSET_BOUNDS.right / RINK_ASSET_WIDTH) * RINK_LENGTH,
  bottom: (RINK_ASSET_BOUNDS.bottom / RINK_ASSET_HEIGHT) * RINK_WIDTH,
};
const RINK_VIEWBOX_LENGTH =
  RINK_VIEWBOX_BOUNDS.right - RINK_VIEWBOX_BOUNDS.left;
const RINK_VIEWBOX_WIDTH = RINK_VIEWBOX_BOUNDS.bottom - RINK_VIEWBOX_BOUNDS.top;
const RINK_CENTER_LOGO_SIZE = 50;

const normalizeId = (value: string | number | null | undefined) =>
  String(value ?? "").trim();

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const getPlayEventText = (play: Play) =>
  [play.type?.text, play.text, play.shortDescription]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const isGoalPlay = (play: Play) =>
  play.scoringPlay === true || /\bgoals?\b/.test(getPlayEventText(play));

const isBlockedShot = (play: Play) =>
  /\b(block|blocked|blocks)\b/.test(getPlayEventText(play));

const matchesEventFilter = (play: Play, filter: ShotEventFilter) => {
  if (filter === "Goals") {
    return isGoalPlay(play);
  }

  if (filter === "Blocked Shots") {
    return isBlockedShot(play);
  }

  return true;
};

export default function ShotChart({
  plays = [],
  homeId,
  awayId,
  homeEspnId = "0",
  awayEspnId = "0",
  homeColor,
  awayColor,
  homeLogo,
  awayLogo,
  league,
  neutralSite = false,
  state,
}: ShotChartProps) {
  const { resolvedColorScheme } = usePreferences();

  const isDark = resolvedColorScheme === "dark";
  const styles = shotChartStyles(isDark);

  const homeColorValue = homeColor || Colors.midTone;
  const awayColorValue = awayColor || Colors.midTone;

  const homeDatabaseIdString = normalizeId(homeId);
  const awayDatabaseIdString = normalizeId(awayId);
  const homeEspnIdString = normalizeId(homeEspnId);
  const awayEspnIdString = normalizeId(awayEspnId);

  const [layout, setLayout] = useState({
    width: 0,
    height: 0,
  });

  const [selectedPeriod, setSelectedPeriod] = useState<ShotChartTab>("All");
  const [selectedEventFilter, setSelectedEventFilter] =
    useState<ShotEventFilter>("All Events");

  const homeTeam = getNHLTeam(homeId);
  const awayTeam = getNHLTeam(awayId);

  const rinkLogo = useMemo(() => {
    return getNHLTeamLogo(homeId, false);
  }, [homeId]);

  const tabs: ShotChartTab[] = ["All", "1st", "2nd", "3rd"];

  const periodOptions = tabs.map((tab) => ({
    label: tab,
    value: tab,
  }));

  const eventOptions: { label: ShotEventFilter; value: ShotEventFilter }[] = [
    {
      label: "All Events",
      value: "All Events",
    },
    {
      label: "Goals",
      value: "Goals",
    },
    {
      label: "Blocked Shots",
      value: "Blocked Shots",
    },
  ];

  const filteredPlays = useMemo(() => {
    const periodMap: Partial<Record<ShotChartTab, number>> = {
      "1st": 1,
      "2nd": 2,
      "3rd": 3,
    };

    return plays.filter((play) => {
      if (!play.coordinate || !play.shootingPlay) {
        return false;
      }

      if (!matchesEventFilter(play, selectedEventFilter)) {
        return false;
      }

      return (
        selectedPeriod === "All" ||
        play.period?.number === periodMap[selectedPeriod]
      );
    });
  }, [plays, selectedEventFilter, selectedPeriod]);

  const renderShots = filteredPlays.map((play, index) => {
    const rawX = Number(play.coordinate?.x);
    const rawY = Number(play.coordinate?.y);

    if (!Number.isFinite(rawX) || !Number.isFinite(rawY)) {
      return null;
    }

    const playTeamId = normalizeId(play.team?.id);

    /*
     * Plays can contain either the ESPN team ID or the database team ID.
     * Check both so team colors are applied correctly.
     */
    const matchesHomeEspnId =
      playTeamId !== "" && playTeamId === homeEspnIdString;

    const matchesAwayEspnId =
      playTeamId !== "" && playTeamId === awayEspnIdString;

    const matchesHomeDatabaseId =
      playTeamId !== "" && playTeamId === homeDatabaseIdString;

    const matchesAwayDatabaseId =
      playTeamId !== "" && playTeamId === awayDatabaseIdString;

    /*
     * ESPN IDs take priority. The database-ID fallback is used when
     * the play response has already been converted to internal IDs.
     */
    const isHomeShot =
      matchesHomeEspnId || (!matchesAwayEspnId && matchesHomeDatabaseId);

    const isAwayShot =
      matchesAwayEspnId ||
      (!matchesHomeEspnId && !isHomeShot && matchesAwayDatabaseId);

    const rinkX = clamp(rawX + RINK_HALF_LENGTH, 0, RINK_LENGTH);
    const rinkY = clamp(RINK_HALF_WIDTH - rawY, 0, RINK_WIDTH);

    /*
     * The rink PNG includes transparent padding around the drawn rink.
     * Scale NHL coordinates into the visible rink bounds inside that asset.
     */
    const svgX =
      RINK_VIEWBOX_BOUNDS.left + (rinkX / RINK_LENGTH) * RINK_VIEWBOX_LENGTH;
    const svgY =
      RINK_VIEWBOX_BOUNDS.top + (rinkY / RINK_WIDTH) * RINK_VIEWBOX_WIDTH;

    const color = isHomeShot
      ? homeColorValue
      : isAwayShot
        ? awayColorValue
        : Colors.midTone;

    const made = play.scoringPlay === true;
    const shotKey = `${play.id ?? "shot"}-${index}`;

    if (made) {
      return (
        <Circle
          key={shotKey}
          cx={svgX}
          cy={svgY}
          r={1.4}
          fill={color}
          opacity={0.9}
        />
      );
    }

    return (
      <React.Fragment key={shotKey}>
        <Circle
          cx={svgX}
          cy={svgY}
          r={1.4}
          fill={Colors.white}
          opacity={0.95}
        />

        <Circle
          cx={svgX}
          cy={svgY}
          r={1.2}
          stroke={color}
          strokeWidth={0.9}
          fill="none"
          opacity={0.9}
        />
      </React.Fragment>
    );
  });

  const MadeView = ({ color }: { color: string }) => (
    <View
      style={[
        styles.madeMarker,
        {
          backgroundColor: color,
        },
      ]}
    />
  );

  const MissView = ({ color }: { color: string }) => (
    <View
      style={[
        styles.missedMarker,
        {
          borderColor: color,
        },
      ]}
    />
  );

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;

    setLayout({
      width,
      height,
    });
  };

  const handlePeriodSelect = (value: string) => {
    if (tabs.includes(value as ShotChartTab)) {
      setSelectedPeriod(value as ShotChartTab);
    }
  };

  const handleEventSelect = (value: string) => {
    if (eventOptions.some((option) => option.value === value)) {
      setSelectedEventFilter(value as ShotEventFilter);
    }
  };

  if (state === "pre") {
    return null;
  }

  return (
    <View style={styles.container}>
      <HeadingTwo isDark={isDark}>Shot Chart</HeadingTwo>

      <View style={styles.wrapper}>
        <View style={styles.dropdownRow}>
          <Dropdown
            options={periodOptions}
            selectedValue={selectedPeriod}
            onSelect={handlePeriodSelect}
            isDark={isDark}
            width={142}
          />

          <Dropdown
            options={eventOptions}
            selectedValue={selectedEventFilter}
            onSelect={handleEventSelect}
            isDark={isDark}
            width={165}
          />
        </View>

        <View style={styles.chartWrapper} onLayout={onLayout}>
          <Image
            source={rinkImage}
            style={styles.rinkImageStyle}
            resizeMode="stretch"
          />

          {!neutralSite &&
            rinkLogo &&
            layout.width > 0 &&
            layout.height > 0 && (
              <Image
                source={rinkLogo}
                style={[
                  styles.rinkLogo,
                  {
                    left: layout.width / 2 - RINK_CENTER_LOGO_SIZE / 2,
                    top: layout.height / 2 - RINK_CENTER_LOGO_SIZE / 2,
                  },
                ]}
                resizeMode="contain"
              />
            )}

          <Svg
            width="100%"
            height="100%"
            viewBox="0 0 200 85"
            style={StyleSheet.absoluteFill}
          >
            {renderShots}
          </Svg>
        </View>

        <View style={styles.legendContainer}>
          {awayTeam && (
            <View style={styles.legendItem}>
              <Image
                source={awayLogo}
                style={styles.legendLogo}
                resizeMode="contain"
              />

              <View style={styles.divider} />

              <Text style={styles.legendText}>Make</Text>
              <MadeView color={awayColorValue} />

              <Text style={styles.legendText}>Miss</Text>
              <MissView color={awayColorValue} />
            </View>
          )}

          {homeTeam && (
            <View style={styles.legendItem}>
              <Text style={styles.legendText}>Make</Text>
              <MadeView color={homeColorValue} />

              <Text style={styles.legendText}>Miss</Text>
              <MissView color={homeColorValue} />

              <View style={styles.divider} />

              <Image
                source={homeLogo}
                style={styles.legendLogo}
                resizeMode="contain"
              />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

export const shotChartStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      width: "100%",
    },

    wrapper: {
      borderWidth: 1,
      borderColor: Colors.midTone,
      borderRadius: 8,
      overflow: "hidden",
    },

    dropdownRow: {
      zIndex: 20,
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 12,
      padding: 12,
    },

    chartWrapper: {
      position: "relative",
      width: "100%",
      aspectRatio: RINK_LENGTH / RINK_WIDTH,
      overflow: "hidden",
    },

    rinkImageStyle: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
    },

    rinkLogo: {
      position: "absolute",
      width: RINK_CENTER_LOGO_SIZE,
      height: RINK_CENTER_LOGO_SIZE,
    },

    legendContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      marginTop: 10,
      padding: 12,
    },

    legendItem: {
      flexShrink: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },

    legendText: {
      fontFamily: Fonts.BOLD,
      fontSize: 14,
      color: isDark ? Colors.white : Colors.black,
    },

    legendLogo: {
      width: 20,
      height: 20,
    },

    divider: {
      width: 1,
      height: 14,
      backgroundColor: isDark ? Colors.white : Colors.black,
    },

    madeMarker: {
      width: 14,
      height: 14,
      borderRadius: 7,
    },

    missedMarker: {
      width: 14,
      height: 14,
      borderWidth: 4,
      borderRadius: 7,
      backgroundColor: Colors.white,
    },
  });
