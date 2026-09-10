import Dropdown from "@/components/Dropdown";
import { Play } from "@/hooks/BasketballHooks/useBasketballGameDetails";
import CBBCourtImage from "assets/Placeholders/CBBCourtPlaceholder.png";
import CourtImage from "assets/Placeholders/CourtPlaceholder.png";
import HeadingTwo from "components/Headings/HeadingTwo";
import { Colors, Fonts } from "constants/styles";
import { getNBATeamLogo, getTeamByESPNId } from "constants/teams";
import { getCBBTeamByESPNId, getCBBTeamLogo } from "constants/teamsCBB";
import { getWCBBTeamByESPNId, getWCBBTeamLogo } from "constants/teamsWCBB";
import { getWNBATeamByESPNId, getWNBATeamLogo } from "constants/teamsWNBA";
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

const COURT_LENGTH = 94;
const COURT_WIDTH = 50;

const normalizeId = (value: string | number | null | undefined) =>
  String(value ?? "").trim();

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

  const isMensCBB = league === "cbb";
  const isWCBB = league === "wcbb";
  const isCollegeBasketball = isMensCBB || isWCBB;
  const isWNBA = league === "wnba";

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

  const homeTeam = useMemo(() => {
    if (isWCBB) {
      return getWCBBTeamByESPNId(homeEspnId);
    }

    if (isMensCBB) {
      return getCBBTeamByESPNId(homeEspnId);
    }

    if (isWNBA) {
      return getWNBATeamByESPNId(homeEspnId);
    }

    return getTeamByESPNId(homeEspnId);
  }, [homeEspnId, isMensCBB, isWCBB, isWNBA]);

  const awayTeam = useMemo(() => {
    if (isWCBB) {
      return getWCBBTeamByESPNId(awayEspnId);
    }

    if (isMensCBB) {
      return getCBBTeamByESPNId(awayEspnId);
    }

    if (isWNBA) {
      return getWNBATeamByESPNId(awayEspnId);
    }

    return getTeamByESPNId(awayEspnId);
  }, [awayEspnId, isMensCBB, isWCBB, isWNBA]);

  const courtLogo = useMemo(() => {
    if (isWCBB) {
      return getWCBBTeamLogo(homeId, false);
    }

    if (isMensCBB) {
      return getCBBTeamLogo(homeId, false);
    }

    if (isWNBA) {
      return getWNBATeamLogo(homeId, false);
    }

    return getNBATeamLogo(homeId, false);
  }, [homeId, isMensCBB, isWCBB, isWNBA]);

  const courtImage = isCollegeBasketball ? CBBCourtImage : CourtImage;

  const tabs: ShotChartTab[] = isCollegeBasketball
    ? ["All", "1st Half", "2nd Half"]
    : ["All", "1st", "2nd", "3rd", "4th"];

  const periodOptions = tabs.map((tab) => ({
    label: tab,
    value: tab,
  }));

  const filteredPlays = useMemo(() => {
    const periodMap: Partial<Record<ShotChartTab, number>> = isCollegeBasketball
      ? {
          "1st Half": 1,
          "2nd Half": 2,
        }
      : {
          "1st": 1,
          "2nd": 2,
          "3rd": 3,
          "4th": 4,
        };

    return plays.filter((play) => {
      if (!play.coordinate || !play.shootingPlay) {
        return false;
      }

      if (selectedPeriod === "All") {
        return true;
      }

      return play.period?.number === periodMap[selectedPeriod];
    });
  }, [plays, selectedPeriod, isCollegeBasketball]);

  const renderShots = filteredPlays.map((play, index) => {
    const rawX = Number(play.coordinate?.x);
    const rawY = Number(play.coordinate?.y);

    if (!Number.isFinite(rawX) || !Number.isFinite(rawY)) {
      return null;
    }

    const playTeamId = normalizeId(play.team?.id);

    /*
     * Plays can contain either the ESPN team ID or the database team ID.
     * Check both so away shots are properly identified and mirrored.
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

    /*
     * ESPN coordinates are represented as:
     * x = court width
     * y = distance along the court
     */
    let svgX = COURT_LENGTH - rawY;
    let svgY = rawX;

    /*
     * ESPN normalizes shots toward the same basket.
     * Mirror away shots so they appear on the opposite side.
     */
    if (isAwayShot) {
      svgX = COURT_LENGTH - svgX;
      svgY = COURT_WIDTH - svgY;
    }

    /*
     * Keep markers inside the SVG if an upstream coordinate
     * is slightly outside the expected court dimensions.
     */
    svgX = Math.max(0, Math.min(COURT_LENGTH, svgX));
    svgY = Math.max(0, Math.min(COURT_WIDTH, svgY));

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
          />
        </View>

        <View style={styles.chartWrapper} onLayout={onLayout}>
          <Image
            source={courtImage}
            style={styles.courtImage}
            resizeMode="stretch"
          />

          {!neutralSite &&
            courtLogo &&
            layout.width > 0 &&
            layout.height > 0 && (
              <Image
                source={courtLogo}
                style={[
                  styles.courtLogo,
                  {
                    left: layout.width / 2 - 75,
                    top: layout.height / 2 - 75,
                  },
                ]}
                resizeMode="contain"
              />
            )}

          <Svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${COURT_LENGTH} ${COURT_WIDTH}`}
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
      alignItems: "center",
      gap: 12,
      padding: 12,
    },

    chartWrapper: {
      position: "relative",
      width: "100%",
      aspectRatio: COURT_LENGTH / COURT_WIDTH,
      overflow: "hidden",
    },

    courtImage: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
    },

    courtLogo: {
      position: "absolute",
      width: 150,
      height: 150,
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
