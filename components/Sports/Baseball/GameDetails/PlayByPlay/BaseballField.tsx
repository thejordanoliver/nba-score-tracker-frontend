import { getMLBFieldImage } from "@/constants/mlb-fields";
import { Colors } from "@/constants/styles";
import type {
  BaseballPlay,
  BaseballSituation,
} from "@/hooks/BaseballHooks/useBaseballGameDetails";
import { Image } from "expo-image";
import React, { memo, useEffect, useMemo } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { Circle, G, Path, Polygon, Svg } from "react-native-svg";
import {
  mapEspnHitCoordinate,
  resolveBaseballPlayAnimation,
  type BaseballBase,
  type BaseballPlayAnimation,
  type BaseballRunnerMovement,
} from "./baseball-play-animation-utils";

export const BASEBALL_FIELD_IMAGE_WIDTH = 780;
export const BASEBALL_FIELD_IMAGE_HEIGHT = 376;
export const BASEBALL_FIELD_ASPECT_RATIO =
  BASEBALL_FIELD_IMAGE_HEIGHT / BASEBALL_FIELD_IMAGE_WIDTH;

export type BaseballFieldProps = {
  width?: number;
  height?: number;
  awayCode?: string;
  homeCode?: string;
  venueId?: string | number | null;
  play?: BaseballPlay | null;
  plays?: BaseballPlay[];
  situation?: BaseballSituation | null;
};

type Point = {
  x: number;
  y: number;
};

const HOME: Point = { x: 390, y: 306 };
const FIRST: Point = { x: 477, y: 268 };
const SECOND: Point = { x: 390, y: 229 };
const THIRD: Point = { x: 303, y: 268 };
const MOUND: Point = { x: 390, y: 270 };

const BASE_POINTS: Record<BaseballBase, Point> = {
  home: HOME,
  first: FIRST,
  second: SECOND,
  third: THIRD,
};

const BALL = Colors.white;
const BALL_STROKE = Colors.black;
const OCCUPIED_BASE = Colors.dark.green;
const PLAY_PATH = Colors.white;
const RUNNER = "#2F74D0";
const SHADOW = "rgba(0,0,0,0.28)";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

function clamp(value: number, minimum: number, maximum: number) {
  "worklet";
  return Math.min(Math.max(value, minimum), maximum);
}

function cubicBezier(
  start: Point,
  controlOne: Point,
  controlTwo: Point,
  end: Point,
  progress: number,
): Point {
  "worklet";
  const t = clamp(progress, 0, 1);
  const inverse = 1 - t;

  return {
    x:
      inverse ** 3 * start.x +
      3 * inverse ** 2 * t * controlOne.x +
      3 * inverse * t ** 2 * controlTwo.x +
      t ** 3 * end.x,
    y:
      inverse ** 3 * start.y +
      3 * inverse ** 2 * t * controlOne.y +
      3 * inverse * t ** 2 * controlTwo.y +
      t ** 3 * end.y,
  };
}

function distance(first: Point, second: Point) {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

function getPitchEndpoint(coordinate: Point): Point {
  return {
    x: HOME.x + clamp((coordinate.x - 125) / 125, -1, 1) * 11,
    y: HOME.y + clamp((coordinate.y - 125) / 125, -1, 1) * 5,
  };
}

function getBallPath(animation: BaseballPlayAnimation) {
  const end =
    animation.kind === "hit"
      ? mapEspnHitCoordinate(
          animation.coordinate,
          BASEBALL_FIELD_IMAGE_WIDTH,
          BASEBALL_FIELD_IMAGE_HEIGHT,
        )
      : getPitchEndpoint(animation.coordinate);
  const start = animation.kind === "hit" ? HOME : MOUND;
  const trajectory = animation.trajectory?.trim().toUpperCase() ?? "";
  const horizontalDistance = end.x - start.x;
  const verticalDistance = end.y - start.y;
  const isGroundBall = trajectory === "G";
  const isLineDrive = trajectory === "L";
  const lift = isGroundBall ? 10 : isLineDrive ? 46 : 132;
  const controlOne = {
    x: start.x + horizontalDistance * 0.48,
    y: Math.min(start.y + verticalDistance * 0.35 - lift, start.y - lift),
  };
  const controlTwo = {
    x: start.x + horizontalDistance * 0.82,
    y: isGroundBall
      ? end.y - 4
      : Math.min(end.y - lift * 0.16, controlOne.y + lift * 0.2),
  };
  const pathLength =
    distance(start, controlOne) +
    distance(controlOne, controlTwo) +
    distance(controlTwo, end);

  return {
    start,
    end,
    controlOne,
    controlTwo,
    pathLength,
    path: `M ${start.x} ${start.y} C ${controlOne.x} ${controlOne.y}, ${controlTwo.x} ${controlTwo.y}, ${end.x} ${end.y}`,
  };
}

function getRunnerPathPoints(movement: BaseballRunnerMovement): Point[] {
  const basePath = [HOME, FIRST, SECOND, THIRD, HOME];
  const startIndex =
    movement.from === "home"
      ? 0
      : (["first", "second", "third"] as const).indexOf(movement.from) + 1;
  let endIndex =
    movement.to === "home"
      ? basePath.length - 1
      : (["first", "second", "third"] as const).indexOf(movement.to) + 1;

  if (movement.from === "home" && movement.to === "home") {
    endIndex = basePath.length - 1;
  }

  if (endIndex <= startIndex) {
    return [BASE_POINTS[movement.from], BASE_POINTS[movement.to]];
  }

  return basePath.slice(startIndex, endIndex + 1);
}

function getPointAlongPath(points: Point[], progress: number): Point {
  "worklet";
  const safeProgress = clamp(progress, 0, 1);
  const segmentCount = Math.max(points.length - 1, 1);
  const scaledProgress = safeProgress * segmentCount;
  const segmentIndex = Math.min(Math.floor(scaledProgress), segmentCount - 1);
  const segmentProgress = scaledProgress - segmentIndex;
  const start = points[segmentIndex] ?? points[0];
  const end = points[segmentIndex + 1] ?? start;

  return {
    x: start.x + (end.x - start.x) * segmentProgress,
    y: start.y + (end.y - start.y) * segmentProgress,
  };
}

function AnimatedRunner({
  movement,
  progress,
}: {
  movement: BaseballRunnerMovement;
  progress: SharedValue<number>;
}) {
  const points = useMemo(() => getRunnerPathPoints(movement), [movement]);
  const animatedProps = useAnimatedProps(() => {
    const point = getPointAlongPath(points, progress.value);
    const isAtRest = progress.value <= 0.005 || progress.value >= 0.995;
    const outFade = movement.isOut
      ? clamp((0.9 - progress.value) / 0.2, 0, 1)
      : 1;

    return {
      cx: point.x,
      cy: point.y,
      opacity: isAtRest ? 0 : outFade,
    };
  });

  return (
    <AnimatedCircle
      animatedProps={animatedProps}
      r={7}
      fill={RUNNER}
      stroke={BALL}
      strokeWidth={2}
    />
  );
}

function FieldPlayAnimation({
  animation,
}: {
  animation: BaseballPlayAnimation | null;
}) {
  const reducedMotion = useReducedMotion();

  const ballProgress = useSharedValue(1);
  const runnerProgress = useSharedValue(1);
  const trajectoryOpacity = useSharedValue(0);

  const ballPath = useMemo(
    () => (animation ? getBallPath(animation) : null),
    [animation],
  );

  const animationKey = animation?.key ?? null;
  const animationKind = animation?.kind ?? null;

  useEffect(() => {
    cancelAnimation(ballProgress);
    cancelAnimation(runnerProgress);
    cancelAnimation(trajectoryOpacity);

    if (!animationKey || !animationKind || reducedMotion) {
      ballProgress.value = 1;
      runnerProgress.value = 1;
      trajectoryOpacity.value = 0;
      return;
    }

    const isHit = animationKind === "hit";

    ballProgress.value = 0;
    runnerProgress.value = 0;
    trajectoryOpacity.value = isHit ? 1 : 0;

    const ballDelay = isHit ? 160 : 40;
    const ballDuration = isHit ? 1180 : 420;

    ballProgress.value = withDelay(
      ballDelay,
      withTiming(1, {
        duration: ballDuration,
        easing: isHit ? Easing.linear : Easing.in(Easing.quad),
      }),
    );

    runnerProgress.value = withDelay(
      isHit ? 300 : 0,
      withTiming(1, {
        duration: 980,
        easing: Easing.inOut(Easing.cubic),
      }),
    );

    // Keep the completed trajectory visible after the ball lands,
    // then fade it away.
    if (isHit) {
      trajectoryOpacity.value = withDelay(
        ballDelay + ballDuration + 400,
        withTiming(0, {
          duration: 500,
          easing: Easing.out(Easing.quad),
        }),
      );
    }

    return () => {
      cancelAnimation(ballProgress);
      cancelAnimation(runnerProgress);
      cancelAnimation(trajectoryOpacity);
    };
  }, [
    animationKey,
    animationKind,
    ballProgress,
    reducedMotion,
    runnerProgress,
    trajectoryOpacity,
  ]);

  const ballProps = useAnimatedProps(() => {
    if (!ballPath) {
      return {
        cx: HOME.x,
        cy: HOME.y,
        opacity: 0,
      };
    }

    const point = cubicBezier(
      ballPath.start,
      ballPath.controlOne,
      ballPath.controlTwo,
      ballPath.end,
      ballProgress.value,
    );

    const isAtStart = ballProgress.value <= 0.005;
    const isAtEnd = ballProgress.value >= 0.995;

    return {
      cx: point.x,
      cy: point.y,
      opacity: isAtStart || isAtEnd ? 0 : 1,
    };
  });

  const shadowProps = useAnimatedProps(() => {
    if (!ballPath || animation?.kind !== "hit") {
      return {
        cx: HOME.x,
        cy: HOME.y,
        opacity: 0,
      };
    }

    const progress = clamp(ballProgress.value, 0, 1);

    return {
      cx: ballPath.start.x + (ballPath.end.x - ballPath.start.x) * progress,

      cy: ballPath.start.y + (ballPath.end.y - ballPath.start.y) * progress + 6,

      opacity: progress <= 0.005 || progress >= 0.995 ? 0 : 0.28,
    };
  });

  const trajectoryProps = useAnimatedProps(() => {
    const progress = clamp(ballProgress.value, 0, 1);

    return {
      opacity: trajectoryOpacity.value,
      strokeDashoffset: (ballPath?.pathLength ?? 0) * (1 - progress),
    };
  });

  if (!animation || !ballPath) {
    return null;
  }

  return (
    <G pointerEvents="none">
      {animation.kind === "hit" ? (
        <>
          {/* Dark outline so trajectory stays visible
              against lighter parts of the field */}
          <AnimatedPath
            animatedProps={trajectoryProps}
            d={ballPath.path}
            fill="none"
            stroke={BALL_STROKE}
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={`${ballPath.pathLength} ${ballPath.pathLength}`}
          />

          {/* Main trajectory */}
          <AnimatedPath
            animatedProps={trajectoryProps}
            d={ballPath.path}
            fill="none"
            stroke={PLAY_PATH}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={`${ballPath.pathLength} ${ballPath.pathLength}`}
          />
        </>
      ) : null}

      {/* Ball shadow */}
      <AnimatedCircle animatedProps={shadowProps} r={8} fill={SHADOW} />

      {/* Baseball */}
      <AnimatedCircle
        animatedProps={ballProps}
        r={6}
        fill={BALL}
        stroke={BALL_STROKE}
        strokeWidth={1.8}
      />

      {/* Base runners */}
      {animation.runnerMovements.map((movement) => (
        <AnimatedRunner
          key={`${animation.key}:${movement.athleteId}:${movement.from}:${movement.to}`}
          movement={movement}
          progress={runnerProgress}
        />
      ))}
    </G>
  );
}

function OccupiedBase({ point }: { point: Point }) {
  const halfWidth = 9;
  const halfHeight = 5;

  return (
    <Polygon
      points={[
        `${point.x},${point.y - halfHeight}`,
        `${point.x + halfWidth},${point.y}`,
        `${point.x},${point.y + halfHeight}`,
        `${point.x - halfWidth},${point.y}`,
      ].join(" ")}
      fill={OCCUPIED_BASE}
      stroke={BALL}
      strokeWidth={1.4}
      strokeLinejoin="round"
    />
  );
}

function BaseballField({
  width = BASEBALL_FIELD_IMAGE_WIDTH,
  height,
  awayCode = "AWAY",
  homeCode = "HOME",
  venueId,
  play,
  plays = [],
  situation,
}: BaseballFieldProps) {
  const fieldHeight = height ?? width * BASEBALL_FIELD_ASPECT_RATIO;
  const fieldImage = useMemo(
    () => getMLBFieldImage(homeCode, venueId),
    [homeCode, venueId],
  );
  const playAnimation = useMemo(
    () => resolveBaseballPlayAnimation(plays, play),
    [play, plays],
  );
  const bases = useMemo(
    () => ({
      onFirst: Boolean(play?.onFirst) || Boolean(situation?.bases?.onFirst),
      onSecond: Boolean(play?.onSecond) || Boolean(situation?.bases?.onSecond),
      onThird: Boolean(play?.onThird) || Boolean(situation?.bases?.onThird),
    }),
    [
      play?.onFirst,
      play?.onSecond,
      play?.onThird,
      situation?.bases?.onFirst,
      situation?.bases?.onSecond,
      situation?.bases?.onThird,
    ],
  );
  const inning = play?.period?.number ?? null;
  const half = play?.period?.type ?? null;
  const outs = play?.outs ?? situation?.outs ?? 0;
  const count = play?.resultCount ?? play?.pitchCount ?? situation ?? null;
  const gameStateLabel = useMemo(() => {
    const occupiedBases = [
      bases.onFirst ? "first" : null,
      bases.onSecond ? "second" : null,
      bases.onThird ? "third" : null,
    ].filter((base): base is string => Boolean(base));

    return [
      half && inning !== null ? `${half} ${inning}` : null,
      `${count?.balls ?? 0}-${count?.strikes ?? 0} count`,
      `${outs} ${outs === 1 ? "out" : "outs"}`,
      occupiedBases.length > 0
        ? `${occupiedBases.join(", ")} occupied`
        : "bases empty",
    ]
      .filter(Boolean)
      .join(", ");
  }, [bases, count?.balls, count?.strikes, half, inning, outs]);

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`${awayCode} at ${homeCode} baseball field, ${gameStateLabel}`}
      style={{
        position: "relative",
        width,
        height: fieldHeight,
      }}
    >
      <Image
        source={fieldImage}
        contentFit="contain"
        accessible={false}
        style={{ width: "100%", height: "100%" }}
      />
      <Svg
        width={width}
        height={fieldHeight}
        viewBox={`0 0 ${BASEBALL_FIELD_IMAGE_WIDTH} ${BASEBALL_FIELD_IMAGE_HEIGHT}`}
        pointerEvents="none"
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        {bases.onFirst ? <OccupiedBase point={FIRST} /> : null}
        {bases.onSecond ? <OccupiedBase point={SECOND} /> : null}
        {bases.onThird ? <OccupiedBase point={THIRD} /> : null}
        <FieldPlayAnimation animation={playAnimation} />
      </Svg>
    </View>
  );
}

export default memo(BaseballField);
