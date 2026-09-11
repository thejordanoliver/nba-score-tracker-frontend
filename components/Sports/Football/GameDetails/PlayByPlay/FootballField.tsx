// components/Sports/Football/GameDetails/FootballField.tsx

import { Colors, Fonts } from "@/constants/styles";
import { getCFBTeamLogo } from "@/constants/teamsCFB";
import { getNFLTeamLogo } from "@/constants/teamsNFL";
import type {
  FootballDrives,
  PlayObject,
} from "@/hooks/FootballHooks/useFootballGameDetails";
import React, { memo, useEffect, useMemo } from "react";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import {
  ClipPath,
  Defs,
  G,
  Image,
  Line,
  Path,
  Polygon,
  Rect,
  Svg,
  Text as SvgText,
} from "react-native-svg";

type FootballFieldProps = {
  width?: number;
  height?: number;

  awayCode?: string;
  homeCode?: string;

  awayName?: string;
  homeName?: string;

  awayTeamId?: string | number | null;
  homeTeamId?: string | number | null;

  playId?: string | number | null;
  playSequenceNumber?: string | number | null;

  drives?: FootballDrives | null;
  play?: PlayObject | null;

  awayColor?: string;
  homeColor?: string;

  showPlay?: boolean;
  isDark?: boolean;
  state?: string | null;
  league?: string | null;
  neutralSite?: boolean;
};

type TeamIdentity = {
  id?: string | number | null;
  espnId?: string | number | null;
  abbreviation?: string | null;
  code?: string | null;
};

const VIEWBOX_WIDTH = 600;

const FIELD_LEFT = 50;
const FIELD_RIGHT = 550;
const FIELD_WIDTH = FIELD_RIGHT - FIELD_LEFT;

const FIELD_TOP = 12;
const FIELD_BOTTOM = 96;
const FIELD_DEPTH_BOTTOM = FIELD_BOTTOM + 5;
const FIELD_MIDDLE_Y = (FIELD_TOP + FIELD_BOTTOM) / 2;
const KICK_TARGET_Y = FIELD_TOP + 8;
const FIELD_TOP_LEFT = 108;
const FIELD_TOP_RIGHT = 492;
const FIELD_TOP_WIDTH = FIELD_TOP_RIGHT - FIELD_TOP_LEFT;
const ENDZONE_TOP_WIDTH = FIELD_TOP_WIDTH / 10;
const FIELD_OUTER_TOP_LEFT = FIELD_TOP_LEFT - ENDZONE_TOP_WIDTH;
const FIELD_OUTER_TOP_RIGHT = FIELD_TOP_RIGHT + ENDZONE_TOP_WIDTH;
const FIELD_LABEL_Y = 128;
const ENDZONE_LOGO_WIDTH = 50;
const ENDZONE_LOGO_HEIGHT = 50;
const ENDZONE_LOGO_ROTATION = -90;
const AWAY_ENDZONE_CENTER_X =
  (0 + FIELD_LEFT + FIELD_OUTER_TOP_LEFT + FIELD_TOP_LEFT) / 4;
const HOME_ENDZONE_CENTER_X = VIEWBOX_WIDTH - AWAY_ENDZONE_CENTER_X;
const ENDZONE_LOGO_Y = FIELD_MIDDLE_Y - ENDZONE_LOGO_HEIGHT / 2;
const ENDZONE_TEXT_Y = FIELD_MIDDLE_Y + 4;
const MIDFIELD_LOGO_WIDTH = 120;
const MIDFIELD_LOGO_HEIGHT = 120;

const MIDFIELD_LOGO_CENTER_X = VIEWBOX_WIDTH / 2;
const MIDFIELD_LOGO_CENTER_Y = FIELD_MIDDLE_Y;

const MIDFIELD_LOGO_X = MIDFIELD_LOGO_CENTER_X - MIDFIELD_LOGO_WIDTH / 2;

const MIDFIELD_LOGO_Y = MIDFIELD_LOGO_CENTER_Y - MIDFIELD_LOGO_HEIGHT / 2;

// Flatten the logo to match the field plane.
// 0.50 keeps it visibly foreshortened without making it look crushed.
const MIDFIELD_LOGO_PERSPECTIVE_SCALE_Y = 0.25;

// Skew angle that "flattens" the endzone logo onto the field's perspective
// plane. The goal line and back line of the endzone aren't vertical — they
// converge toward the top the same way the yard lines do — so a plain
// rotate(90) makes the logo look like a sticker standing up instead of
// artwork painted on the turf. Skewing by the average slope of those two
// lines keeps the logo's long edges parallel to them, so it reads as lying
// flat in the endzone.
const AWAY_GOAL_LINE_SLOPE =
  (FIELD_TOP_LEFT - FIELD_LEFT) / (FIELD_TOP - FIELD_BOTTOM);
const AWAY_BACK_LINE_SLOPE =
  (FIELD_OUTER_TOP_LEFT - 0) / (FIELD_TOP - FIELD_BOTTOM);
const ENDZONE_LOGO_SKEW_DEG =
  (Math.atan((AWAY_GOAL_LINE_SLOPE + AWAY_BACK_LINE_SLOPE) / 2) * 180) /
  Math.PI;

const LIGHT_GRASS = "#568A3C";
const DARK_GRASS = "#477936";
const FIELD_LINE = "rgba(255,255,255,0.78)";
const FIELD_BORDER = Colors.white;
const PLAY_COLOR = Colors.white;
const FIRST_DOWN_COLOR = "#E2CE23";
const GOAL_POST_COLOR = "#E2CE23";
const MISSED_KICK_COLOR = "#FF5A5F";
const GOAL_POST_BASE_COLOR = "#6C6E6F";
const GOAL_POST_INSET_X = FIELD_LEFT - 22;
const FOOTBALL_COLOR = "#7A4528";
const POSSESSION_MARKER_CENTER_X = 15;
const POSSESSION_MARKER_TIP_Y = 52.32;
const POSSESSION_MARKER_SCALE = 1.28;
const YARDAGE_BADGE_WIDTH = 64;
const YARDAGE_BADGE_HEIGHT = 22;
const YARDAGE_BADGE_Y = FIELD_MIDDLE_Y + 14;
const PLAY_PATH_ANIMATION_DURATION = 520;

const AnimatedPath = Animated.createAnimatedComponent(Path);

type KickPlayType = "fieldGoal" | "pat";

type AnimatedPlayPathProps = {
  d: string;
  pathLength: number;
  stroke?: string;
  strokeWidth: number;
  strokeLinecap?: "round";
  strokeLinejoin?: "round";
  delay?: number;
  duration?: number;
  opacity?: number;
};

const PASS_PLAY_TYPES = new Set([
  "pass",
  "pass reception",
  "passing touchdown",
  "interception return",
]);

const RUSH_PLAY_TYPES = new Set([
  "rush",
  "rushing touchdown",
  "quarterback scramble",
  "scramble",
  "kneel",
  "kneel down",
  "qb kneel",
]);

const INCOMPLETE_PASS_TYPES = new Set(["pass incompletion", "incomplete pass"]);

function AnimatedPlayPath({
  d,
  pathLength,
  stroke = PLAY_COLOR,
  strokeWidth,
  strokeLinecap = "round",
  strokeLinejoin,
  delay = 0,
  duration = PLAY_PATH_ANIMATION_DURATION,
  opacity = 1,
}: AnimatedPlayPathProps) {
  const progress = useSharedValue(0);
  const safePathLength = Math.max(1, pathLength);

  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(
      delay,
      withTiming(1, {
        duration,
        easing: Easing.out(Easing.cubic),
      }),
    );

    return () => {
      cancelAnimation(progress);
    };
  }, [d, delay, duration, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: safePathLength * (1 - progress.value),
  }));

  return (
    <AnimatedPath
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeDasharray={`${safePathLength} ${safePathLength}`}
      animatedProps={animatedProps}
      strokeLinecap={strokeLinecap}
      strokeLinejoin={strokeLinejoin}
      opacity={opacity}
    />
  );
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function getScoreValue(value: unknown) {
  const scoreValue = Number(value);

  return Number.isFinite(scoreValue) ? scoreValue : null;
}

function getPlaySearchText(play?: PlayObject | null) {
  return [
    play?.type?.text,
    play?.type?.abbreviation,
    play?.scoringType?.name,
    play?.scoringType?.displayName,
    play?.scoringType?.abbreviation,
    play?.result,
    play?.shortDisplayResult,
    play?.displayResult,
    play?.text,
    play?.shortText,
    play?.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getKickPlayType(play?: PlayObject | null): KickPlayType | null {
  if (!play) return null;

  const searchText = getPlaySearchText(play);
  const scoreValue = getScoreValue(play.scoreValue);
  const isFieldGoal =
    searchText.includes("field goal") || /\bfg\b/.test(searchText);

  if (isFieldGoal || scoreValue === 3) {
    return "fieldGoal";
  }

  const isPat =
    searchText.includes("extra point") ||
    searchText.includes("point after") ||
    /\bpat\b/.test(searchText) ||
    /\bxp\b/.test(searchText);

  if (isPat || scoreValue === 1) {
    return "pat";
  }

  return null;
}

function isMissedOrBlockedKick(play?: PlayObject | null) {
  const searchText = getPlaySearchText(play);

  return (
    searchText.includes("no good") ||
    searchText.includes("miss") ||
    searchText.includes("blocked")
  );
}

function normalizeId(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return String(value);
}

function normalizeTeamCode(value?: string | null) {
  return value?.trim().toUpperCase() || null;
}

function teamMatches(
  team: TeamIdentity | null | undefined,
  teamId: string | number | null | undefined,
  teamCode: string | null | undefined,
) {
  const normalizedTeamId = normalizeId(teamId);
  const normalizedTeamCode = normalizeTeamCode(teamCode);

  const possibleTeamIds = [normalizeId(team?.id)].filter(
    (value): value is string => Boolean(value),
  );

  const actualTeamCode = normalizeTeamCode(team?.code);

  return Boolean(
    (normalizedTeamId && possibleTeamIds.includes(normalizedTeamId)) ||
    (normalizedTeamCode && actualTeamCode === normalizedTeamCode),
  );
}

function positionToX(position: number) {
  const safePosition = clamp(position, 0, 100);

  return FIELD_LEFT + (safePosition / 100) * FIELD_WIDTH;
}

function getTopX(position: number) {
  const safePosition = clamp(position, 0, 100);

  return FIELD_TOP_LEFT + (safePosition / 100) * FIELD_TOP_WIDTH;
}

function getPerspectiveX(position: number, y: number) {
  const topX = getTopX(position);
  const bottomX = positionToX(position);

  const progress = clamp((y - FIELD_TOP) / (FIELD_BOTTOM - FIELD_TOP), 0, 1);

  return topX + (bottomX - topX) * progress;
}

function positionToPlayX(position: number) {
  return getPerspectiveX(position, FIELD_MIDDLE_Y);
}

function getPossessionMarkerTransform(x: number) {
  const translateX = x - POSSESSION_MARKER_CENTER_X * POSSESSION_MARKER_SCALE;
  const translateY =
    FIELD_MIDDLE_Y - POSSESSION_MARKER_TIP_Y * POSSESSION_MARKER_SCALE;

  return `translate(${translateX} ${translateY}) scale(${POSSESSION_MARKER_SCALE})`;
}

function getTenYardPolygon(index: number) {
  const bottomStart = FIELD_LEFT + index * 50;
  const bottomEnd = bottomStart + 50;

  const topSegmentWidth = FIELD_TOP_WIDTH / 10;
  const topStart = FIELD_TOP_LEFT + index * topSegmentWidth;
  const topEnd = topStart + topSegmentWidth;

  return [
    `${bottomStart},${FIELD_BOTTOM}`,
    `${bottomEnd},${FIELD_BOTTOM}`,
    `${topEnd},${FIELD_TOP}`,
    `${topStart},${FIELD_TOP}`,
  ].join(" ");
}

function getAllDrivePlays(drives?: FootballDrives | null) {
  const allDrives = [...(drives?.previous ?? []), ...(drives?.current ?? [])];

  return allDrives.flatMap((drive) =>
    Array.isArray(drive?.plays) ? drive.plays : [],
  );
}

function findSelectedPlay({
  drives,
  play,
  playId,
  playSequenceNumber,
}: {
  drives?: FootballDrives | null;
  play?: PlayObject | null;
  playId?: string | number | null;
  playSequenceNumber?: string | number | null;
}) {
  if (play) {
    return play;
  }

  const normalizedPlayId = normalizeId(playId);
  const normalizedSequence = normalizeId(playSequenceNumber);
  const plays = getAllDrivePlays(drives);

  if (normalizedPlayId) {
    const matchingPlay = plays.find(
      (candidate) => normalizeId(candidate.id) === normalizedPlayId,
    );

    if (matchingPlay) {
      return matchingPlay;
    }
  }

  if (normalizedSequence) {
    return (
      plays.find(
        (candidate) =>
          normalizeId(candidate.sequenceNumber) === normalizedSequence,
      ) ?? null
    );
  }

  return plays.at(-1) ?? null;
}

function getPlayType(play?: PlayObject | null) {
  return (
    play?.type?.text?.trim().toLowerCase() ||
    play?.type?.abbreviation?.trim().toLowerCase() ||
    ""
  );
}

function isPassPlay(play?: PlayObject | null) {
  const playType = getPlayType(play);
  const description = play?.text?.toLowerCase() ?? "";

  return (
    PASS_PLAY_TYPES.has(playType) ||
    INCOMPLETE_PASS_TYPES.has(playType) ||
    playType.includes("pass") ||
    description.includes(" pass ")
  );
}

function isRushingPlay(play?: PlayObject | null) {
  const playType = getPlayType(play);

  const abbreviation = play?.type?.abbreviation?.trim().toLowerCase() ?? "";

  const description = play?.text?.trim().toLowerCase() ?? "";

  return (
    RUSH_PLAY_TYPES.has(playType) ||
    abbreviation === "rush" ||
    abbreviation === "rushing td" ||
    playType.includes("rush") ||
    playType.includes("scramble") ||
    playType.includes("kneel") ||
    description.includes(" up the middle ") ||
    description.includes(" left end ") ||
    description.includes(" right end ") ||
    description.includes(" left guard ") ||
    description.includes(" right guard ") ||
    description.includes(" left tackle ") ||
    description.includes(" right tackle ") ||
    description.includes(" scrambles ") ||
    description.includes(" kneels ")
  );
}

function isIncompletePass(play?: PlayObject | null) {
  const playType = getPlayType(play);
  const description = play?.text?.toLowerCase() ?? "";

  return (
    INCOMPLETE_PASS_TYPES.has(playType) ||
    playType.includes("incomplete") ||
    description.includes("incomplete")
  );
}

function getPossessionTeam(play: PlayObject, drives?: FootballDrives | null) {
  const currentDrive = drives?.current?.at(-1) ?? null;

  return play.start?.team ?? play.end?.team ?? currentDrive?.team ?? null;
}

function getFieldPosition(
  yardsToEndzone: number | null | undefined,
  isHomePossession: boolean,
) {
  if (
    yardsToEndzone === null ||
    yardsToEndzone === undefined ||
    !Number.isFinite(yardsToEndzone)
  ) {
    return null;
  }

  const safeYardsToEndzone = clamp(yardsToEndzone, 0, 100);

  return isHomePossession ? safeYardsToEndzone : 100 - safeYardsToEndzone;
}

function getFirstDownPosition({
  startPosition,
  distance,
  isHomePossession,
}: {
  startPosition: number;
  distance: number | null | undefined;
  isHomePossession: boolean;
}) {
  const parsedDistance = Number(distance);

  if (!Number.isFinite(parsedDistance) || parsedDistance <= 0) {
    return null;
  }

  const direction = isHomePossession ? -1 : 1;

  return clamp(startPosition + parsedDistance * direction, 0, 100);
}

function createDriveShape({
  play,
  drives,
  homeTeamId,
  awayTeamId,
  awayCode,
  homeCode,
}: {
  play: PlayObject;
  drives?: FootballDrives | null;
  homeTeamId?: string | number | null;
  awayTeamId?: string | number | null;
  awayCode?: string | null;
  homeCode?: string | null;
}) {
  const possessionTeam = getPossessionTeam(play, drives);

  const isHomePossession = teamMatches(possessionTeam, homeTeamId, homeCode);

  const isAwayPossession = teamMatches(possessionTeam, awayTeamId, awayCode);

  const rawStartYardsToEndzone = Number(play.start?.yardsToEndzone);

  const rawEndYardsToEndzone = Number(play.end?.yardsToEndzone);

  const startPosition = getFieldPosition(
    rawStartYardsToEndzone,
    isHomePossession,
  );

  let endPosition = getFieldPosition(rawEndYardsToEndzone, isHomePossession);

  if (startPosition === null) {
    return null;
  }

  if (endPosition === null) {
    const rawStatYardage = Number(play.statYardage ?? 0);

    const statYardage = Number.isFinite(rawStatYardage) ? rawStatYardage : 0;

    const direction = isHomePossession ? -1 : 1;

    endPosition = clamp(startPosition + statYardage * direction, 0, 100);
  }

  const startX = positionToPlayX(startPosition);
  const endX = positionToPlayX(endPosition);

  const pass = isPassPlay(play);
  const incomplete = isIncompletePass(play);
  const rush = isRushingPlay(play);
  const kickPlayType = getKickPlayType(play);
  const isKick = kickPlayType !== null;
  const isMissedKick = isMissedOrBlockedKick(play);

  const rawYardsAfterCatch = Number(play.yardsAfterCatch ?? 0);

  const yardsAfterCatch = Number.isFinite(rawYardsAfterCatch)
    ? Math.max(0, rawYardsAfterCatch)
    : 0;

  const direction = isHomePossession ? -1 : 1;

  const catchPosition =
    pass && !incomplete
      ? clamp(endPosition - yardsAfterCatch * direction, 0, 100)
      : endPosition;

  const catchX = positionToPlayX(catchPosition);

  const passDistance = Math.abs(catchX - startX);
  const curveHeight = clamp(passDistance * 0.34, 8, 25);
  const controlY = FIELD_MIDDLE_Y - curveHeight;
  const passPathLength = Math.max(passDistance * 1.25 + curveHeight * 1.4, 16);

  const firstDownPosition = getFirstDownPosition({
    startPosition,
    distance: play.start?.distance,
    isHomePossession,
  });

  const rawStatYardage = Number(play.statYardage ?? 0);

  const statYardage = Number.isFinite(rawStatYardage)
    ? Math.abs(rawStatYardage)
    : 0;

  const possessionCode =
    possessionTeam?.abbreviation ??
    possessionTeam?.code ??
    (isHomePossession ? homeCode : isAwayPossession ? awayCode : null);

  const rushPath = (() => {
    const description = play.text?.toLowerCase() ?? "";
    const rushDistance = Math.abs(endX - startX);

    if (rushDistance < 8) {
      return [
        `M ${startX} ${FIELD_MIDDLE_Y}`,
        `L ${endX} ${FIELD_MIDDLE_Y}`,
      ].join(" ");
    }

    if (
      description.includes("left end") ||
      description.includes("left tackle") ||
      description.includes("scrambles left")
    ) {
      return [
        `M ${startX} ${FIELD_MIDDLE_Y}`,
        `Q ${(startX + endX) / 2} ${FIELD_MIDDLE_Y - 13}`,
        `${endX} ${FIELD_MIDDLE_Y}`,
      ].join(" ");
    }

    if (
      description.includes("right end") ||
      description.includes("right tackle") ||
      description.includes("scrambles right")
    ) {
      return [
        `M ${startX} ${FIELD_MIDDLE_Y}`,
        `Q ${(startX + endX) / 2} ${FIELD_MIDDLE_Y + 13}`,
        `${endX} ${FIELD_MIDDLE_Y}`,
      ].join(" ");
    }

    return [
      `M ${startX} ${FIELD_MIDDLE_Y}`,
      `L ${endX} ${FIELD_MIDDLE_Y}`,
    ].join(" ");
  })();

  const rushPathLength =
    Math.max(Math.abs(endX - startX), 1) + (rushPath.includes("Q") ? 24 : 0);

  const yardsAfterCatchPathLength = Math.max(Math.abs(endX - catchX), 1);

  const kickTargetX = isKick
    ? isHomePossession
      ? GOAL_POST_INSET_X + 17
      : VIEWBOX_WIDTH - GOAL_POST_INSET_X - 17
    : null;

  const kickTargetY = isKick ? KICK_TARGET_Y : null;

  const kickPath =
    kickTargetX !== null && kickTargetY !== null
      ? [
          `M ${startX} ${FIELD_MIDDLE_Y}`,
          `Q ${(startX + kickTargetX) / 2} ${-6}`,
          `${kickTargetX} ${kickTargetY}`,
        ].join(" ")
      : null;

  const kickPathLength =
    kickTargetX !== null && kickTargetY !== null
      ? Math.max(
          Math.hypot(kickTargetX - startX, kickTargetY - FIELD_MIDDLE_Y) * 1.4,
          40,
        )
      : null;

  const kickLabel =
    kickPlayType === "fieldGoal" ? "FG" : kickPlayType === "pat" ? "PAT" : null;

  return {
    startX,
    catchX,
    endX,
    footballX: kickTargetX ?? endX,
    footballY: kickTargetY ?? FIELD_MIDDLE_Y,

    firstDownTopX:
      firstDownPosition !== null ? getTopX(firstDownPosition) : null,

    firstDownBottomX:
      firstDownPosition !== null ? positionToX(firstDownPosition) : null,

    isRush: rush && !isKick,
    isPass: pass && !isKick,
    isKick,
    isIncomplete: incomplete,
    isMissedKick,

    passPath: [
      `M ${startX} ${FIELD_MIDDLE_Y}`,
      `C ${startX} ${controlY}`,
      `${catchX} ${controlY}`,
      `${catchX} ${FIELD_MIDDLE_Y}`,
    ].join(" "),
    passPathLength,

    rushPath,
    rushPathLength,

    yardsAfterCatchPath:
      pass && !incomplete && yardsAfterCatch > 0
        ? [`M ${catchX} ${FIELD_MIDDLE_Y}`, `L ${endX} ${FIELD_MIDDLE_Y}`].join(
            " ",
          )
        : null,
    yardsAfterCatchPathLength,

    kickPath,
    kickPathLength,

    statLabel:
      kickLabel !== null
        ? `${kickLabel}${isMissedKick ? " MISS" : ""}`
        : yardsAfterCatch > 0
          ? `${yardsAfterCatch} YAC`
          : `${statYardage} YDS`,

    possessionCode,
  };
}

function FootballField({
  width = VIEWBOX_WIDTH,
  height = 150,
  awayCode = "AWAY",
  homeCode = "HOME",
  awayTeamId,
  homeTeamId,
  awayName = "AWAY",
  homeName = "HOME",
  playId,
  playSequenceNumber,
  drives,
  play,
  awayColor = Colors.midTone,
  homeColor = Colors.midTone,
  showPlay = true,
  isDark = true,
  league,
  neutralSite,
}: FootballFieldProps) {
  const selectedPlay = useMemo(
    () =>
      findSelectedPlay({
        drives,
        play,
        playId,
        playSequenceNumber,
      }),
    [drives, play, playId, playSequenceNumber],
  );

  const driveShape = useMemo(() => {
    if (!selectedPlay) {
      return null;
    }

    return createDriveShape({
      play: selectedPlay,
      drives,
      homeTeamId,
      awayTeamId,
      homeCode,
      awayCode,
    });
  }, [selectedPlay, drives, homeTeamId, awayTeamId, homeCode, awayCode]);

  const oneYardMarkers = useMemo(() => {
    return Array.from({ length: 99 }, (_, index) => {
      const position = index + 1;

      // Full ten-yard lines are rendered separately.
      if (position % 10 === 0) {
        return null;
      }

      const topInnerY = FIELD_TOP + 5;
      const bottomInnerY = FIELD_BOTTOM - 5;

      return {
        key: `one-yard-${position}`,

        topX: getTopX(position),
        topInnerX: getPerspectiveX(position, topInnerY),
        topInnerY,

        bottomInnerX: getPerspectiveX(position, bottomInnerY),
        bottomInnerY,
        bottomX: positionToX(position),
      };
    }).filter(
      (
        marker,
      ): marker is {
        key: string;
        topX: number;
        topInnerX: number;
        topInnerY: number;
        bottomInnerX: number;
        bottomInnerY: number;
        bottomX: number;
      } => marker !== null,
    );
  }, []);

  const yardLabels = ["10", "20", "30", "40", "50", "40", "30", "20", "10"];

  const possessionTeam = selectedPlay
    ? getPossessionTeam(selectedPlay, drives)
    : null;

  const isHomePossession = teamMatches(possessionTeam, homeTeamId, homeCode);
  const isAwayPossession = teamMatches(possessionTeam, awayTeamId, awayCode);
  const isCFB = league === "cfb";

  const possessionLogo =
    isHomePossession && isCFB
      ? getCFBTeamLogo(homeTeamId ?? 0, true)
      : isHomePossession
        ? getNFLTeamLogo(homeTeamId ?? 0, true)
        : isAwayPossession && isCFB
          ? getCFBTeamLogo(awayTeamId ?? 0, true)
          : isAwayPossession
            ? getNFLTeamLogo(awayTeamId ?? 0, true)
            : null;

  const possessionColor = isHomePossession
    ? homeColor
    : isAwayPossession
      ? awayColor
      : Colors.midTone;

  const awayEndzoneLogo = isCFB
    ? getCFBTeamLogo(awayTeamId ?? 0, true)
    : getNFLTeamLogo(awayTeamId ?? 0, true);
  const homeEndzoneLogo = isCFB
    ? getCFBTeamLogo(homeTeamId ?? 0, true)
    : getNFLTeamLogo(homeTeamId ?? 0, true);
  const midfieldLogo = isCFB
    ? getCFBTeamLogo(homeTeamId ?? 0, true)
    : getNFLTeamLogo(homeTeamId ?? 0, true);

  const selectedPlayAnimationKey = selectedPlay
    ? (normalizeId(selectedPlay.id) ??
      normalizeId(selectedPlay.sequenceNumber) ??
      normalizeId(selectedPlay.sequence) ??
      selectedPlay.text ??
      "selected-play")
    : "no-play";

  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 -8 600 130"
      accessibilityRole="image"
      accessibilityLabel={`${awayCode} versus ${homeCode} football field play`}
    >
      <Defs>
        {/* Regulation playing surface without either end zone */}
        <ClipPath id="playingFieldClip">
          <Polygon
            points={`${FIELD_TOP_LEFT},${FIELD_TOP} ${FIELD_TOP_RIGHT},${FIELD_TOP} ${FIELD_RIGHT},${FIELD_BOTTOM} ${FIELD_LEFT},${FIELD_BOTTOM}`}
          />
        </ClipPath>

        <ClipPath id="awayEndzoneClip">
          <Polygon
            points={`${FIELD_OUTER_TOP_LEFT},${FIELD_TOP} ${FIELD_TOP_LEFT},${FIELD_TOP} ${FIELD_LEFT},${FIELD_BOTTOM} 0,${FIELD_BOTTOM}`}
          />
        </ClipPath>

        <ClipPath id="homeEndzoneClip">
          <Polygon
            points={`${FIELD_TOP_RIGHT},${FIELD_TOP} ${FIELD_OUTER_TOP_RIGHT},${FIELD_TOP} ${VIEWBOX_WIDTH},${FIELD_BOTTOM} ${FIELD_RIGHT},${FIELD_BOTTOM}`}
          />
        </ClipPath>
      </Defs>

      {/* Field depth */}
      <G>
        {Array.from({ length: 10 }, (_, index) => (
          <Rect
            key={`field-side-${index}`}
            x={FIELD_LEFT + index * 50}
            y={FIELD_BOTTOM}
            width={50}
            height={FIELD_DEPTH_BOTTOM - FIELD_BOTTOM}
            fill={index % 2 === 0 ? LIGHT_GRASS : DARK_GRASS}
          />
        ))}

        <Rect
          x={0}
          y={FIELD_BOTTOM}
          width={FIELD_LEFT}
          height={FIELD_DEPTH_BOTTOM - FIELD_BOTTOM}
          fill={awayColor}
        />

        <Rect
          x={FIELD_RIGHT}
          y={FIELD_BOTTOM}
          width={50}
          height={FIELD_DEPTH_BOTTOM - FIELD_BOTTOM}
          fill={homeColor}
        />

        <Polygon
          points={`${VIEWBOX_WIDTH - 0.05},${FIELD_DEPTH_BOTTOM} 0,${FIELD_DEPTH_BOTTOM} 0.05,${FIELD_BOTTOM} ${VIEWBOX_WIDTH},${FIELD_BOTTOM}`}
          fill="rgba(0,0,0,0.18)"
        />
      </G>

      {/* Main field */}
      <G>
        {Array.from({ length: 10 }, (_, index) => (
          <Polygon
            key={`field-section-${index}`}
            points={getTenYardPolygon(index)}
            fill={index % 2 === 0 ? LIGHT_GRASS : DARK_GRASS}
          />
        ))}

        {/* Away end zone */}
        <G>
          <Polygon
            points={`${FIELD_LEFT},${FIELD_BOTTOM} 0,${FIELD_BOTTOM} ${FIELD_OUTER_TOP_LEFT},${FIELD_TOP} ${FIELD_TOP_LEFT},${FIELD_TOP}`}
            fill={awayColor}
          />

          {awayEndzoneLogo ? (
            <G clipPath="url(#awayEndzoneClip)">
              <G
                transform={`translate(${AWAY_ENDZONE_CENTER_X} ${FIELD_MIDDLE_Y}) skewX(${ENDZONE_LOGO_SKEW_DEG}) rotate(${ENDZONE_LOGO_ROTATION}) translate(${-AWAY_ENDZONE_CENTER_X} ${-FIELD_MIDDLE_Y})`}
              >
                <Image
                  href={awayEndzoneLogo}
                  x={AWAY_ENDZONE_CENTER_X - ENDZONE_LOGO_WIDTH / 2}
                  y={ENDZONE_LOGO_Y}
                  width={ENDZONE_LOGO_WIDTH}
                  height={ENDZONE_LOGO_HEIGHT}
                  opacity={0.95}
                  preserveAspectRatio="xMidYMid meet"
                />
              </G>
            </G>
          ) : (
            <SvgText
              x={AWAY_ENDZONE_CENTER_X}
              y={ENDZONE_TEXT_Y}
              fill={Colors.white}
              fontSize={11}
              fontFamily={Fonts.BOLD}
              textAnchor="middle"
            >
              {awayName}
            </SvgText>
          )}
        </G>

        {/* Home end zone */}
        <G>
          <Polygon
            points={`${VIEWBOX_WIDTH},${FIELD_BOTTOM} ${FIELD_RIGHT},${FIELD_BOTTOM} ${FIELD_TOP_RIGHT},${FIELD_TOP} ${FIELD_OUTER_TOP_RIGHT},${FIELD_TOP}`}
            fill={homeColor}
          />

          {homeEndzoneLogo ? (
            <G clipPath="url(#homeEndzoneClip)">
              <G
                transform={`translate(${HOME_ENDZONE_CENTER_X} ${FIELD_MIDDLE_Y}) skewX(${-ENDZONE_LOGO_SKEW_DEG}) rotate(${-ENDZONE_LOGO_ROTATION}) translate(${-HOME_ENDZONE_CENTER_X} ${-FIELD_MIDDLE_Y})`}
              >
                <Image
                  href={homeEndzoneLogo}
                  x={HOME_ENDZONE_CENTER_X - ENDZONE_LOGO_WIDTH / 2}
                  y={ENDZONE_LOGO_Y}
                  width={ENDZONE_LOGO_WIDTH}
                  height={ENDZONE_LOGO_HEIGHT}
                  opacity={0.95}
                  preserveAspectRatio="xMidYMid meet"
                />
              </G>
            </G>
          ) : (
            <SvgText
              x={HOME_ENDZONE_CENTER_X}
              y={ENDZONE_TEXT_Y}
              fill={Colors.white}
              fontSize={11}
              fontFamily={Fonts.BOLD}
              textAnchor="middle"
            >
              {homeName}
            </SvgText>
          )}
        </G>

        {/* One-yard sideline markers */}
        <G clipPath="url(#playingFieldClip)">
          {oneYardMarkers.map((marker) => (
            <G key={marker.key}>
              {/* Far sideline */}
              <Line
                x1={marker.topX}
                y1={FIELD_TOP}
                x2={marker.topInnerX}
                y2={marker.topInnerY}
                stroke={FIELD_LINE}
                strokeWidth={0.9}
                strokeLinecap="round"
              />

              {/* Near sideline */}
              <Line
                x1={marker.bottomInnerX}
                y1={marker.bottomInnerY}
                x2={marker.bottomX}
                y2={FIELD_BOTTOM}
                stroke={FIELD_LINE}
                strokeWidth={0.9}
                strokeLinecap="round"
              />
            </G>
          ))}
        </G>

        {/* Ten-yard lines */}
        <G clipPath="url(#playingFieldClip)">
          {Array.from({ length: 11 }, (_, index) => {
            const position = index * 10;

            return (
              <Line
                key={`ten-yard-${position}`}
                x1={getTopX(position)}
                y1={FIELD_TOP}
                x2={positionToX(position)}
                y2={FIELD_BOTTOM}
                stroke={FIELD_BORDER}
                strokeWidth={position === 50 ? 2.4 : 1.5}
              />
            );
          })}
        </G>

        {/* Midfield logo
    Render AFTER all field markings so the logo sits on top of the lines.
    Vertical compression makes it appear painted onto the field plane.
*/}
        {midfieldLogo && !neutralSite ? (
          <G clipPath="url(#playingFieldClip)">
            <G
              transform={`
        translate(
          ${MIDFIELD_LOGO_CENTER_X}
          ${MIDFIELD_LOGO_CENTER_Y}
        )
        scale(1 ${MIDFIELD_LOGO_PERSPECTIVE_SCALE_Y})
        translate(
          ${-MIDFIELD_LOGO_CENTER_X}
          ${-MIDFIELD_LOGO_CENTER_Y}
        )
      `}
            >
              <Image
                href={midfieldLogo}
                x={MIDFIELD_LOGO_X}
                y={MIDFIELD_LOGO_Y}
                width={MIDFIELD_LOGO_WIDTH}
                height={MIDFIELD_LOGO_HEIGHT}
                opacity={1}
                preserveAspectRatio="xMidYMid meet"
              />
            </G>
          </G>
        ) : null}

        {/* Full field border */}
        <Polygon
          points={`${FIELD_OUTER_TOP_LEFT},${FIELD_TOP} ${FIELD_OUTER_TOP_RIGHT},${FIELD_TOP} ${VIEWBOX_WIDTH},${FIELD_BOTTOM} 0,${FIELD_BOTTOM}`}
          fill="none"
          stroke={FIELD_BORDER}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </G>

      {/* Goal posts */}
      <G>
        {/* Away goal post */}
        <G transform={`translate(${GOAL_POST_INSET_X} 0)`}>
          <Path
            fill={GOAL_POST_BASE_COLOR}
            d="M6,48.75s0-.75,2-.75,2,.75,2,.75v8.5s0,.75-2,.75-2-.75-2-.75v-8.5Z"
          />

          <G fill={GOAL_POST_COLOR}>
            <Path d="M18 10.4v26.6c0 .18-.05.36-.14.51l-6 10c-.23.39-.69.57-1.12.45-.43-.12-.73-.51-.73-.96V16.4s0-.4 1-.4 1 .4 1 .4v26.99l4-6.67V10.4s0-.4 1-.4 1 .4 1 .4Z" />

            <Path d="M13 43c-2.21 0-4 1.79-4 4v2s0 .4-1 .4-1-.4-1-.4v-2c0-3.31 2.69-6 6-6h1v2h-1Z" />
          </G>
        </G>

        {/* Home goal post */}
        <G
          transform={`translate(${
            VIEWBOX_WIDTH - GOAL_POST_INSET_X
          } 0) scale(-1 1)`}
        >
          <Path
            fill={GOAL_POST_BASE_COLOR}
            d="M6,48.75s0-.75,2-.75,2,.75,2,.75v8.5s0,.75-2,.75-2-.75-2-.75v-8.5Z"
          />

          <G fill={GOAL_POST_COLOR}>
            <Path d="M18 10.4v26.6c0 .18-.05.36-.14.51l-6 10c-.23.39-.69.57-1.12.45-.43-.12-.73-.51-.73-.96V16.4s0-.4 1-.4 1 .4 1 .4v26.99l4-6.67V10.4s0-.4 1-.4 1 .4 1 .4Z" />

            <Path d="M13 43c-2.21 0-4 1.79-4 4v2s0 .4-1 .4-1-.4-1-.4v-2c0-3.31 2.69-6 6-6h1v2h-1Z" />
          </G>
        </G>
      </G>

      {/* First-down marker */}
      {showPlay &&
      driveShape &&
      driveShape.firstDownTopX !== null &&
      driveShape.firstDownBottomX !== null ? (
        <G>
          <Line
            x1={driveShape.firstDownTopX}
            y1={FIELD_TOP}
            x2={driveShape.firstDownBottomX}
            y2={FIELD_BOTTOM}
            stroke={FIRST_DOWN_COLOR}
            strokeWidth={2}
          />

          <Line
            x1={driveShape.firstDownBottomX}
            y1={FIELD_BOTTOM}
            x2={driveShape.firstDownBottomX}
            y2={FIELD_DEPTH_BOTTOM}
            stroke="#CFBD1B"
            strokeWidth={2}
          />
        </G>
      ) : null}

      {/* Current play */}
      {showPlay && driveShape ? (
        <G>
          {driveShape.kickPath && driveShape.kickPathLength !== null ? (
            <AnimatedPlayPath
              key={`${selectedPlayAnimationKey}-kick`}
              d={driveShape.kickPath}
              pathLength={driveShape.kickPathLength}
              stroke={
                driveShape.isMissedKick ? MISSED_KICK_COLOR : GOAL_POST_COLOR
              }
              strokeWidth={3}
            />
          ) : null}

          {driveShape.isPass ? (
            <>
              <AnimatedPlayPath
                key={`${selectedPlayAnimationKey}-pass`}
                d={driveShape.passPath}
                pathLength={driveShape.passPathLength}
                strokeWidth={2.6}
                opacity={driveShape.isIncomplete ? 0.72 : 1}
              />

              {driveShape.yardsAfterCatchPath ? (
                <AnimatedPlayPath
                  key={`${selectedPlayAnimationKey}-yac`}
                  d={driveShape.yardsAfterCatchPath}
                  pathLength={driveShape.yardsAfterCatchPathLength}
                  strokeWidth={3.6}
                  delay={180}
                />
              ) : null}
            </>
          ) : null}

          {driveShape.isRush ? (
            <AnimatedPlayPath
              key={`${selectedPlayAnimationKey}-rush`}
              d={driveShape.rushPath}
              pathLength={driveShape.rushPathLength}
              strokeWidth={3.6}
              strokeLinejoin="round"
            />
          ) : null}

          {/* Football */}
          <G
            transform={`translate(${driveShape.footballX} ${driveShape.footballY})`}
          >
            <Path
              d="M.3 2.861c3.369 0 4.655-2.961 4.655-2.961S3.669-3.061.3-3.061-4.355-.1-4.355-.1-3.068 2.861.3 2.861Z"
              fill={FOOTBALL_COLOR}
              stroke={Colors.white}
              strokeWidth={0.6}
            />

            <Line
              x1={-1.6}
              y1={-1.1}
              x2={1.8}
              y2={-1.1}
              stroke={Colors.white}
              strokeWidth={0.5}
            />
          </G>

          {/* Possession marker */}
          <G
            transform={`${getPossessionMarkerTransform(driveShape.endX)} translate(0 -8)`}
          >
            <Path
              d="M15 12.5c8.7 0 15.75 7.05 15.75 15.75 0 8.7-7.8 16.7-15.22 24.07a.75.75 0 0 1-1.06 0C7.05 44.95-.75 36.95-.75 28.25-.75 19.55 6.3 12.5 15 12.5Z"
              fill={possessionColor}
              stroke={Colors.white}
              strokeWidth={1.5}
            />

            {possessionLogo ? (
              <Image
                href={possessionLogo}
                x={3.5}
                y={16.5}
                width={23}
                height={23}
                preserveAspectRatio="xMidYMid meet"
              />
            ) : (
              <SvgText
                x={15}
                y={31}
                fill={Colors.white}
                fontSize={12}
                fontFamily={Fonts.REGULAR}
                textAnchor="middle"
              >
                {driveShape.possessionCode}
              </SvgText>
            )}
          </G>

          {/* Yardage badge */}
          <G
            transform={`translate(${clamp(
              driveShape.endX - YARDAGE_BADGE_WIDTH / 2,
              4,
              VIEWBOX_WIDTH - YARDAGE_BADGE_WIDTH - 4,
            )} ${YARDAGE_BADGE_Y})`}
          >
            <Rect
              width={YARDAGE_BADGE_WIDTH}
              height={YARDAGE_BADGE_HEIGHT}
              rx={YARDAGE_BADGE_HEIGHT / 2}
              stroke={Colors.white}
              fill={
                isDark
                  ? Colors.dark.itemBackground
                  : Colors.light.itemBackground
              }
            />

            <SvgText
              x={YARDAGE_BADGE_WIDTH / 2}
              y={15}
              fill={isDark ? Colors.white : Colors.black}
              fontSize={11}
              fontFamily={Fonts.BOLD}
              textAnchor="middle"
            >
              {driveShape.statLabel}
            </SvgText>
          </G>
        </G>
      ) : null}

      {/* Team codes and yard labels */}
      <G>
        <SvgText
          x={25}
          y={FIELD_LABEL_Y}
          fill={isDark ? Colors.white : Colors.black}
          fontSize={21}
          fontFamily={Fonts.BOLD}
          textAnchor="middle"
        >
          {awayCode}
        </SvgText>

        {yardLabels.map((label, index) => (
          <SvgText
            key={`${label}-${index}`}
            x={100 + index * 50}
            y={FIELD_LABEL_Y}
            fill={isDark ? Colors.white : Colors.black}
            fontSize={21}
            fontFamily={Fonts.BOLD}
            textAnchor="middle"
          >
            {label}
          </SvgText>
        ))}

        <SvgText
          x={575}
          y={FIELD_LABEL_Y}
          fill={isDark ? Colors.white : Colors.black}
          fontSize={21}
          fontFamily={Fonts.BOLD}
          textAnchor="middle"
        >
          {homeCode}
        </SvgText>
      </G>
    </Svg>
  );
}

export default memo(FootballField);
