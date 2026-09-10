import Dropdown from "@/components/Dropdown";
import HeadingTwo from "@/components/Headings/HeadingTwo";
import { Colors, Fonts } from "@/constants/styles";
import type {
  Shot,
  ShotOutcome,
} from "@/hooks/SoccerHooks/useSoccerGameDetails";
import { Image } from "expo-image";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  Line,
  Path,
  Rect,
} from "react-native-svg";

const FIELD_WIDTH = 672;
const FIELD_HEIGHT = 397;
const UNKNOWN_PLAYER = "Unknown Player";

export type ShotCoordinateMode = "espn" | "percentage";

type SoccerShotMapProps = {
  shots?: Shot[];
  homeLogo: any;
  awayLogo: any;
  homeCode: string;
  awayCode: string;
  homeColor: string;
  awayColor: string;
  homeId: string | number;
  awayId: string | number;
  coordinateMode?: ShotCoordinateMode;
  orientTeamsToGoals?: boolean;
  flipVerticalCoordinates?: boolean;
  height?: number;
  isDark?: boolean;
  state: string;
};

type FilterOption = {
  value: string;
  label: string;
};

type ShotPoint = {
  x: number;
  y: number;
};

const SHOT_OUTCOMES: {
  value: ShotOutcome;
  label: string;
}[] = [
  {
    value: "goal",
    label: "Goal",
  },
  {
    value: "saved",
    label: "Save",
  },
  {
    value: "off-target",
    label: "Off Target",
  },
  {
    value: "blocked",
    label: "Blocked",
  },

  {
    value: "unknown",
    label: "Unknown",
  },
];

const LEGEND_OUTCOMES: {
  value: ShotOutcome;
  label: string;
}[] = [
  {
    value: "goal",
    label: "Goal",
  },
  {
    value: "saved",
    label: "Save",
  },
  {
    value: "blocked",
    label: "Blocked",
  },
  {
    value: "off-target",
    label: "Off Target",
  },
];

const clamp = (value: number, minimum: number, maximum: number) => {
  return Math.max(minimum, Math.min(value, maximum));
};

const isValidCoordinate = (
  value: number | null | undefined,
): value is number => {
  return typeof value === "number" && Number.isFinite(value);
};

const convertCoordinate = (
  value: number,
  dimension: number,
  mode: ShotCoordinateMode,
) => {
  const converted = mode === "percentage" ? (value / 100) * dimension : value;

  return clamp(converted, 0, dimension);
};

const getPeriodLabel = (period: number) => {
  if (period === 1) return "First Half";
  if (period === 2) return "Second Half";

  return `Period ${period}`;
};

const getPlayerName = (shot: Shot) => {
  const name = shot.player.name?.trim();

  return name || UNKNOWN_PLAYER;
};

const getTeamName = (shot: Shot) => {
  const name = shot.team.name?.trim();

  return name || "Unknown Team";
};

const formatClock = (clock: string | number | null) => {
  if (clock === null || clock === undefined) return null;

  if (typeof clock === "number") {
    return `${clock}'`;
  }

  const value = clock.trim();

  if (!value) return null;
  if (value.includes("'") || value.includes(":")) return value;
  if (/^\d+$/.test(value)) return `${value}'`;

  return value;
};

const getOutcomeLabel = (outcome: ShotOutcome) => {
  return (
    SHOT_OUTCOMES.find((item) => item.value === outcome)?.label ?? "Unknown"
  );
};

function OutcomeIcon({
  outcome,
  color,
  size = 18,
}: {
  outcome: ShotOutcome;
  color: string;
  size?: number;
}) {
  const center = size / 2;
  const outerRadius = size / 2 - 1.5;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle
        cx={center}
        cy={center}
        r={outerRadius}
        fill={Colors.white}
        stroke={color}
      />

      {outcome === "goal" ? (
        <>
          <Circle
            cx={center}
            cy={center}
            r={outerRadius}
            fill={color}
            stroke={Colors.white}
            strokeWidth={2.5}
          />
        </>
      ) : null}

      {outcome === "saved" ? (
        <Line
          x1={size * 0.28}
          y1={size * 0.28}
          x2={size * 0.72}
          y2={size * 0.72}
          stroke={color}
          strokeWidth={2.8}
          strokeLinecap="round"
        />
      ) : null}

      {outcome === "blocked" ? (
        <Rect
          x={size * 0.34}
          y={size * 0.34}
          width={size * 0.32}
          height={size * 0.32}
          rx={size * 0.08}
          fill={color}
        />
      ) : null}

      {outcome === "unknown" ? (
        <Circle cx={center} cy={center} r={size * 0.17} fill={Colors.midTone} />
      ) : null}
    </Svg>
  );
}
function ShotMarker({
  outcome,
  x,
  y,
  color,
  selected,
  onPress,
}: {
  outcome: ShotOutcome;
  x: number;
  y: number;
  color: string;
  selected: boolean;
  onPress: () => void;
}) {
  const markerRadius = selected ? 13 : 10;

  return (
    <G onPress={onPress}>
      <Circle cx={x} cy={y} r={18} fill="transparent" />

      {selected ? (
        <Circle cx={x} cy={y} r={16} fill="rgba(255,255,255,0.35)" />
      ) : null}

      <Circle
        cx={x}
        cy={y}
        r={markerRadius}
        fill={Colors.white}
        stroke={color}
      />

      {outcome === "goal" ? (
        <>
          <Circle
            cx={x}
            cy={y}
            r={markerRadius}
            fill={color}
            stroke={Colors.white}
            strokeWidth={2.5}
          />
        </>
      ) : null}

      {outcome === "saved" ? (
        <Line
          x1={x - 5}
          y1={y - 5}
          x2={x + 5}
          y2={y + 5}
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
        />
      ) : null}

      {outcome === "blocked" ? (
        <Rect x={x - 4} y={y - 4} width={8} height={8} rx={2} fill={color} />
      ) : null}

      {outcome === "unknown" ? (
        <Circle cx={x} cy={y} r={3.4} fill={Colors.midTone} />
      ) : null}
    </G>
  );
}

export default function SoccerShotMap({
  shots = [],
  homeId,
  awayId,
  homeLogo,
  awayLogo,
  homeCode,
  awayCode,
  homeColor,
  awayColor,
  coordinateMode = "percentage",
  orientTeamsToGoals = true,
  flipVerticalCoordinates = true,
  height,
  isDark = false,
  state,
}: SoccerShotMapProps) {
  const styles = shotMapStyles(isDark);
  const rawId = useId();
  const svgId = rawId.replace(/:/g, "");

  const clipFieldId = `shot-map-field-${svgId}`;

  const [periodFilter, setPeriodFilter] = useState("all");

  const [playerFilter, setPlayerFilter] = useState("all");

  const [activeOutcomes] = useState<Set<ShotOutcome>>(
    () => new Set(SHOT_OUTCOMES.map((item) => item.value)),
  );

  const [selectedShotId, setSelectedShotId] = useState<string | null>(null);

  const shouldRotateAwayShot = useCallback(
    (shot: Shot) => {
      if (!orientTeamsToGoals) return false;

      const teamId = shot.team.id;

      if (teamId !== null && teamId !== undefined) {
        return String(teamId) === String(awayId);
      }

      return shot.team.homeAway === "away";
    },
    [awayId, orientTeamsToGoals],
  );

  const getShotPoint = useCallback(
    (shot: Shot, x: number | null, y: number | null): ShotPoint | null => {
      if (!isValidCoordinate(x) || !isValidCoordinate(y)) return null;

      const convertedX = convertCoordinate(x, FIELD_WIDTH, coordinateMode);
      const convertedY = convertCoordinate(y, FIELD_HEIGHT, coordinateMode);
      const rotateAwayShot = shouldRotateAwayShot(shot);
      const shotX = rotateAwayShot ? FIELD_WIDTH - convertedX : convertedX;
      const shotY = rotateAwayShot ? FIELD_HEIGHT - convertedY : convertedY;

      return {
        x: shotX,
        y: flipVerticalCoordinates ? FIELD_HEIGHT - shotY : shotY,
      };
    },
    [coordinateMode, flipVerticalCoordinates, shouldRotateAwayShot],
  );

  const validShots = useMemo(() => {
    return shots.filter((shot) =>
      Boolean(getShotPoint(shot, shot.coordinates.x, shot.coordinates.y)),
    );
  }, [shots, getShotPoint]);

  const periodOptions = useMemo<FilterOption[]>(() => {
    const periods = Array.from(
      new Set(
        shots
          .map((shot) => shot.period)
          .filter((period): period is number => typeof period === "number"),
      ),
    ).sort((a, b) => a - b);

    return [
      {
        value: "all",
        label: "All Periods",
      },
      ...periods.map((period) => ({
        value: String(period),
        label: getPeriodLabel(period),
      })),
    ];
  }, [shots]);

  const playerOptions = useMemo<FilterOption[]>(() => {
    const players = new Map<string, string>();

    shots.forEach((shot) => {
      const name = shot.player.name?.trim();

      if (!name) return;

      const value = String(shot.player.id ?? name);

      if (!players.has(value)) {
        players.set(value, name);
      }
    });

    return [
      {
        value: "all",
        label: "All Players",
      },
      ...Array.from(players.entries())
        .map(([value, label]) => ({
          value,
          label,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    ];
  }, [shots]);

  const filteredShots = useMemo(() => {
    return validShots.filter((shot) => {
      const matchesPeriod =
        periodFilter === "all" ||
        (shot.period !== null && String(shot.period) === periodFilter);

      const playerName = shot.player.name?.trim();
      const shotPlayerValue = playerName
        ? String(shot.player.id ?? playerName)
        : "";

      const matchesPlayer =
        playerFilter === "all" || shotPlayerValue === playerFilter;

      const matchesOutcome = activeOutcomes.has(shot.outcome);

      return matchesPeriod && matchesPlayer && matchesOutcome;
    });
  }, [validShots, periodFilter, playerFilter, activeOutcomes]);

  const selectedShot = useMemo(() => {
    return filteredShots.find((shot) => shot.id === selectedShotId) ?? null;
  }, [filteredShots, selectedShotId]);

  useEffect(() => {
    if (
      selectedShotId !== null &&
      !filteredShots.some((shot) => shot.id === selectedShotId)
    ) {
      setSelectedShotId(null);
    }
  }, [filteredShots, selectedShotId]);

  const getTeamColor = (shot: Shot) => {
    const teamId = shot.team.id;

    if (teamId !== null && teamId !== undefined) {
      if (String(homeId) === String(teamId)) {
        return homeColor;
      }

      if (String(awayId) === String(teamId)) {
        return awayColor;
      }
    }

    return Colors.midTone;
  };

  const legendIconColor = isDark ? Colors.lightGray : Colors.darkGray;

  const selectedStartPoint = selectedShot
    ? getShotPoint(
        selectedShot,
        selectedShot.coordinates.x,
        selectedShot.coordinates.y,
      )
    : null;

  const selectedEndPoint = selectedShot
    ? getShotPoint(
        selectedShot,
        selectedShot.coordinates.endX,
        selectedShot.coordinates.endY,
      )
    : null;

  if (state === "pre" || state === "post") return null;

  return (
    <View style={styles.container}>
      <HeadingTwo isDark={isDark}>Shot Map</HeadingTwo>
      <View style={styles.wrapper}>
        <View style={styles.dropdownRow}>
          <Dropdown
            options={periodOptions}
            selectedValue={periodFilter}
            onSelect={setPeriodFilter}
            isDark={isDark}
          />

          <Dropdown
            options={playerOptions}
            selectedValue={playerFilter}
            onSelect={setPlayerFilter}
            isDark={isDark}
          />
        </View>

        <View
          style={[
            styles.fieldContainer,
            height
              ? { height }
              : {
                  aspectRatio: FIELD_WIDTH / FIELD_HEIGHT,
                },
          ]}
        >
          <Svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${FIELD_WIDTH} ${FIELD_HEIGHT}`}
            preserveAspectRatio="none"
          >
            <Defs>
              <ClipPath id={clipFieldId}>
                <Rect width={FIELD_WIDTH} height={FIELD_HEIGHT} />
              </ClipPath>
            </Defs>

            <G clipPath={`url(#${clipFieldId})`}>
              <Rect
                width={FIELD_WIDTH}
                height={FIELD_HEIGHT}
                fill={Colors.dark.green}
              />

              <Rect
                x={0}
                width={105.183}
                height={FIELD_HEIGHT}
                fill={Colors.light.green}
              />

              <Rect
                x={105.183}
                width={115.409}
                height={FIELD_HEIGHT}
                fill={Colors.light.transparentGreen}
              />

              <Rect
                x={220.592}
                width={115.408}
                height={FIELD_HEIGHT}
                fill={Colors.light.green}
              />

              <Rect
                x={336}
                width={115.409}
                height={FIELD_HEIGHT}
                fill={Colors.light.transparentGreen}
              />

              <Rect
                x={451.409}
                width={115.408}
                height={FIELD_HEIGHT}
                fill={Colors.light.green}
              />

              <Rect
                x={566.817}
                width={105.183}
                height={FIELD_HEIGHT}
                fill={Colors.light.transparentGreen}
              />

              {/* Halfway line */}
              <Line
                x1={FIELD_WIDTH / 2}
                y1={0}
                x2={FIELD_WIDTH / 2}
                y2={FIELD_HEIGHT}
                stroke={Colors.white}
                strokeWidth={1.5}
              />

              {/* Center circle */}
              <Circle
                cx={336}
                cy={198.5}
                r={58.4348}
                stroke={Colors.white}
                strokeWidth={1.5}
                fill="none"
              />

              <Circle cx={336} cy={198.5} r={2.2} fill={Colors.white} />

              {/* Left penalty area */}
              <Rect
                x={0}
                y={70.0586}
                width={105.183}
                height={256.882}
                stroke={Colors.white}
                strokeWidth={1.5}
                fill="none"
              />

              {/* Left six-yard box */}
              <Rect
                x={0}
                y={140.118}
                width={35.0609}
                height={116.764}
                stroke={Colors.white}
                strokeWidth={1.5}
                fill="none"
              />

              <Circle cx={70.1231} cy={198.5} r={2.2} fill={Colors.white} />

              <Path
                d="M105 152.1C119.31 162.751 128.58 179.796 128.58 199.006C128.58 218.216 119.31 235.261 105 245.912"
                stroke={Colors.white}
                strokeWidth={1.5}
                strokeLinecap="square"
                fill="none"
              />

              {/* Right penalty area */}
              <Rect
                x={566.817}
                y={70.0586}
                width={105.183}
                height={256.882}
                stroke={Colors.white}
                strokeWidth={1.5}
                fill="none"
              />

              {/* Right six-yard box */}
              <Rect
                x={636.939}
                y={140.118}
                width={35.061}
                height={116.764}
                stroke={Colors.white}
                strokeWidth={1.5}
                fill="none"
              />

              <Circle cx={601.88} cy={198.5} r={2.2} fill={Colors.white} />

              <Path
                d="M567 245.895C552.703 235.242 543.443 218.205 543.443 199.006C543.443 179.806 552.703 162.769 567 152.117"
                stroke={Colors.white}
                strokeWidth={1.5}
                strokeLinecap="square"
                fill="none"
              />

              {/* Selected shot trail */}
              {selectedShot && selectedStartPoint && selectedEndPoint ? (
                <>
                  <Line
                    x1={selectedStartPoint.x}
                    y1={selectedStartPoint.y}
                    x2={selectedEndPoint.x}
                    y2={selectedEndPoint.y}
                    stroke={Colors.white}
                    strokeWidth={3}
                    strokeDasharray="6 5"
                  />

                  <Circle
                    cx={selectedEndPoint.x}
                    cy={selectedEndPoint.y}
                    r={5}
                    fill={Colors.white}
                    stroke={getTeamColor(selectedShot)}
                    strokeWidth={2}
                  />
                </>
              ) : null}

              {/* Shot markers */}
              {filteredShots.map((shot) => {
                const point = getShotPoint(
                  shot,
                  shot.coordinates.x,
                  shot.coordinates.y,
                );

                if (!point) return null;

                return (
                  <ShotMarker
                    key={shot.id}
                    outcome={shot.outcome}
                    x={point.x}
                    y={point.y}
                    color={getTeamColor(shot)}
                    selected={selectedShotId === shot.id}
                    onPress={() => {
                      setSelectedShotId((previous) =>
                        previous === shot.id ? null : shot.id,
                      );
                    }}
                  />
                );
              })}
            </G>
          </Svg>
        </View>

        <View style={styles.legendContainer}>
          <View style={styles.teamLegendRow}>
            {awayId ? (
              <View style={styles.teamLegendItem}>
                <Image
                  source={awayLogo}
                  style={styles.legendLogo}
                  resizeMode="contain"
                />

                <View
                  style={[
                    styles.teamColorDot,
                    { backgroundColor: awayColor ?? Colors.midTone },
                  ]}
                />

                <Text style={styles.legendTeamCode} numberOfLines={1}>
                  {awayCode}
                </Text>
              </View>
            ) : null}

            {homeId ? (
              <View style={[styles.teamLegendItem, styles.homeTeamLegendItem]}>
                <Text style={styles.legendTeamCode} numberOfLines={1}>
                  {homeCode}
                </Text>

                <View
                  style={[
                    styles.teamColorDot,
                    { backgroundColor: homeColor ?? Colors.midTone },
                  ]}
                />

                <Image
                  source={homeLogo}
                  style={styles.legendLogo}
                  resizeMode="contain"
                />
              </View>
            ) : null}
          </View>

          <View style={styles.outcomeLegendRow}>
            {LEGEND_OUTCOMES.map((item) => (
              <View key={item.value} style={styles.outcomeLegendItem}>
                <OutcomeIcon
                  outcome={item.value}
                  color={legendIconColor}
                  size={16}
                />

                <Text style={styles.legendText} numberOfLines={1}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {selectedShot ? (
          <View style={styles.shotDetails}>
            <View style={styles.shotDetailsHeader}>
              <View
                style={[
                  styles.teamIndicator,
                  {
                    backgroundColor: getTeamColor(selectedShot),
                  },
                ]}
              />

              <View style={styles.shotDetailsTitleArea}>
                <Text style={styles.playerName}>
                  {getPlayerName(selectedShot)}
                </Text>

                <Text style={styles.shotMeta}>
                  {[
                    formatClock(selectedShot.clock),
                    getOutcomeLabel(selectedShot.outcome),
                    getTeamName(selectedShot),
                  ]
                    .filter(Boolean)
                    .join(" • ")}
                </Text>
              </View>

              <OutcomeIcon
                outcome={selectedShot.outcome}
                color={getTeamColor(selectedShot)}
                size={24}
              />
            </View>

            {selectedShot.text ? (
              <Text style={styles.shotText}>{selectedShot.text}</Text>
            ) : null}

            {selectedShot.assistedBy?.name ? (
              <Text style={styles.assistText}>
                Assisted by {selectedShot.assistedBy.name}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const shotMapStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      width: "100%",
      overflow: "hidden",
    },

    wrapper: {
      paddingTop: 12,
      borderWidth: 1,
      borderColor: Colors.midTone,
      borderRadius: 8,
      overflow: "hidden",
    },

    dropdownRow: {
      zIndex: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },

    fieldContainer: {
      zIndex: 1,
      width: "100%",
      marginTop: 12,
      overflow: "hidden",
    },

    shotDetails: {
      gap: 10,
      marginTop: 12,
      padding: 14,
    },

    shotDetailsHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },

    teamIndicator: {
      alignSelf: "stretch",
      width: 5,
    },

    shotDetailsTitleArea: {
      flex: 1,
      gap: 3,
    },

    playerName: {
      fontFamily: Fonts.BOLD,
      fontSize: 16,
      color: isDark ? Colors.white : Colors.black,
    },

    legendContainer: {
      gap: 10,
      marginTop: 0,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: isDark
        ? Colors.dark.transparentWhite
        : Colors.light.transparentBlack,
    },

    teamLegendRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },

    teamLegendItem: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      minWidth: 0,
    },

    homeTeamLegendItem: {
      justifyContent: "flex-end",
    },

    teamColorDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },

    outcomeLegendRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "center",
      gap: 14,
    },

    outcomeLegendItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      minHeight: 22,
    },

    legendText: {
      fontFamily: Fonts.BOLD,
      fontSize: 12,
      color: isDark ? Colors.white : Colors.black,
    },

    legendTeamCode: {
      flexShrink: 1,
      fontFamily: Fonts.BOLD,
      fontSize: 13,
      color: isDark ? Colors.white : Colors.black,
    },

    legendLogo: {
      width: 20,
      height: 20,
    },

    shotMeta: {
      fontFamily: Fonts.REGULAR,
      fontSize: 12,
      color: isDark ? Colors.white : Colors.black,
    },

    shotText: {
      fontFamily: Fonts.BOLD,
      fontSize: 13,
      lineHeight: 19,
      color: Colors.midTone,
    },

    assistText: {
      fontFamily: Fonts.MEDIUM,
      fontSize: 12,
      lineHeight: 18,
      color: isDark ? Colors.white : Colors.black,
    },
  });
