import HeadingTwo from "@/components/Headings/HeadingTwo";
import { Colors, Fonts } from "@/constants/styles";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export const MATCHUP_COMPARISON_VARIANTS = [
  "corner-cards",
  "tale-of-tape",
  "spotlight",
] as const;

export type MatchupComparisonVariant =
  (typeof MATCHUP_COMPARISON_VARIANTS)[number];

type ComparisonValue = number | string | null | undefined;

type Props = {
  firstFighterId: number;
  secondFighterId: number;
  firstFighterStance: string;
  secondFighterStance: string;
  firstFighterHeight: string | null;
  secondFighterHeight: string | null;
  firstFighterAge: number | string | null;
  secondFighterAge: number | string | null;
  firstFighterWeight: number | string | null;
  secondFighterWeight: number | string | null;
  firstFighterReach: string | null;
  secondFighterReach: string | null;
  firstFighterName: string | null;
  secondFighterName: string | null;
  firstFighterIsWinner: boolean;
  secondFighterIsWinner: boolean;
  firstFighterRecord: string;
  secondFighterRecord: string;
  firstFighterClass: string;
  secondFighterClass: string;
  firstFighterFlag: string;
  secondFighterFlag: string;
  firstFighterCountry: string | null;
  secondFighterCountry: string | null;
  firstFighterIsChampion: boolean;
  secondFighterIsChampion: boolean | null;
  gameStatusDescription: string | undefined;
  isDark: boolean;
  variant?: MatchupComparisonVariant;
};

type FighterViewModel = {
  id: number | string | null | undefined;
  stanceImage: string | null | undefined;
  name: string;
  flag: string | null | undefined;
  record: string;
  age: ComparisonValue;
  weight: ComparisonValue;
  height: ComparisonValue;
  reach: ComparisonValue;
  className: ComparisonValue;
  country: ComparisonValue;
  isWinner: boolean;
  isChampion: boolean | null;
};

type ComparisonRow = {
  label: string;
  leftValue: ComparisonValue;
  rightValue: ComparisonValue;
};

const FALLBACK_VALUE = "-";
const ROUTE = "/player/mma/[id]";

const formatComparisonValue = (value: ComparisonValue) => {
  if (value === null || value === undefined) return FALLBACK_VALUE;

  const text = String(value).trim();

  if (!text || text.toLowerCase() === "n/a") return FALLBACK_VALUE;

  return text;
};

const hasImageUri = (value: string | null | undefined) => {
  if (!value) return false;

  const text = value.trim();

  return Boolean(text) && text.toLowerCase() !== "n/a";
};

const getFighterId = (id: number | string | null | undefined) => {
  const fighterId = id === null || id === undefined ? "" : String(id);

  if (!fighterId || fighterId === "NaN") return "";

  return fighterId;
};

export default function MatchupComparison({
  firstFighterId,
  secondFighterId,
  firstFighterStance,
  secondFighterStance,
  firstFighterHeight,
  firstFighterAge,
  secondFighterAge,
  secondFighterHeight,
  firstFighterWeight,
  secondFighterWeight,
  firstFighterReach,
  secondFighterReach,
  firstFighterName,
  secondFighterName,
  firstFighterClass,
  secondFighterClass,
  firstFighterFlag,
  secondFighterFlag,
  firstFighterCountry,
  secondFighterCountry,
  firstFighterRecord,
  secondFighterRecord,
  firstFighterIsWinner,
  secondFighterIsWinner,
  secondFighterIsChampion,
  firstFighterIsChampion,
  isDark,
  variant = "spotlight",
}: Props) {
  const router = useRouter();
  const styles = matchupComparisonStyles(isDark);

  const leftFighter: FighterViewModel = {
    id: secondFighterId,
    stanceImage: secondFighterStance,
    name: formatComparisonValue(secondFighterName),
    flag: secondFighterFlag,
    record: formatComparisonValue(secondFighterRecord),
    age: secondFighterAge,
    weight: secondFighterWeight,
    height: secondFighterHeight,
    reach: secondFighterReach,
    className: secondFighterClass,
    country: secondFighterCountry,
    isWinner: secondFighterIsWinner,
    isChampion: secondFighterIsChampion,
  };

  const rightFighter: FighterViewModel = {
    id: firstFighterId,
    stanceImage: firstFighterStance,
    name: formatComparisonValue(firstFighterName),
    flag: firstFighterFlag,
    record: formatComparisonValue(firstFighterRecord),
    age: firstFighterAge,
    weight: firstFighterWeight,
    height: firstFighterHeight,
    reach: firstFighterReach,
    className: firstFighterClass,
    country: firstFighterCountry,
    isWinner: firstFighterIsWinner,
    isChampion: firstFighterIsChampion,
  };
  const rows: ComparisonRow[] = [
    {
      label: "Class",
      leftValue: leftFighter.className,
      rightValue: rightFighter.className,
    },
    {
      label: "Record",
      leftValue: leftFighter.record,
      rightValue: rightFighter.record,
    },
    {
      label: "Height",
      leftValue: leftFighter.height,
      rightValue: rightFighter.height,
    },
    {
      label: "Weight",
      leftValue: leftFighter.weight,
      rightValue: rightFighter.weight,
    },
    {
      label: "Reach",
      leftValue: leftFighter.reach,
      rightValue: rightFighter.reach,
    },
    {
      label: "Age",
      leftValue: leftFighter.age,
      rightValue: rightFighter.age,
    },
    {
      label: "Country",
      leftValue: leftFighter.country,
      rightValue: rightFighter.country,
    },
  ];

  const openFighter = (fighter: FighterViewModel) => {
    const fighterId = getFighterId(fighter.id);

    if (!fighterId) return;

    router.push({
      pathname: ROUTE,
      params: {
        id: fighterId,
        league: "mma"
      },
    });
  };

  const renderBadges = (fighter: FighterViewModel) => {
    if (!fighter.isWinner && !fighter.isChampion) return null;

    return (
      <View style={styles.badgesRow}>
        {fighter.isWinner && (
          <View style={[styles.badge, styles.winnerBadge]}>
            <Text style={styles.badgeText}>WINNER</Text>
          </View>
        )}
        {fighter.isChampion && (
          <View style={[styles.badge, styles.championBadge]}>
            <Text style={styles.badgeText}>CHAMP</Text>
          </View>
        )}
      </View>
    );
  };

  const renderStanceImage = (
    fighter: FighterViewModel,
    imageStyle: StyleProp<ImageStyle>,
  ) => {
    if (hasImageUri(fighter.stanceImage)) {
      return (
        <Image
          source={{ uri: fighter.stanceImage ?? "" }}
          style={imageStyle}
          resizeMode="contain"
          accessibilityLabel={`${fighter.name} stance image`}
        />
      );
    }
  };

  const renderFlag = (fighter: FighterViewModel) => {
    if (!hasImageUri(fighter.flag)) return null;

    return (
      <Image
        source={{ uri: fighter.flag ?? "" }}
        style={styles.flag}
        resizeMode="contain"
        accessibilityLabel={`${fighter.name} flag`}
      />
    );
  };

  const renderFighterPressable = (
    fighter: FighterViewModel,
    content: ReactNode,
    style: StyleProp<ViewStyle>,
  ) => {
    const canOpenFighter = Boolean(getFighterId(fighter.id));

    return (
      <Pressable
        onPress={() => openFighter(fighter)}
        disabled={!canOpenFighter}
        accessibilityRole="button"
        accessibilityLabel={`View ${fighter.name} MMA fighter profile`}
        accessibilityHint="Opens the fighter profile screen"
        accessibilityState={{ disabled: !canOpenFighter }}
        style={({ pressed }) => [
          style,
          fighter.isWinner && styles.winnerBackground,
          fighter.isChampion && styles.championBorder,
          !canOpenFighter && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        {content}
      </Pressable>
    );
  };

  const renderNameBlock = (fighter: FighterViewModel) => (
    <View style={styles.nameBlock}>
      <Text
        style={styles.fighterName}
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.76}
      >
        {fighter.name}
      </Text>
      <View style={styles.metaRow}>
        {renderFlag(fighter)}

      </View>
    </View>
  );

  const renderCornerFighter = (fighter: FighterViewModel) =>
    renderFighterPressable(
      fighter,
      <>
        {renderBadges(fighter)}
        <View style={styles.cornerImageFrame}>
          {renderStanceImage(fighter, styles.cornerImage)}
        </View>
        {renderNameBlock(fighter)}
      </>,
      styles.cornerFighterCard,
    );

  const renderTapeFighter = (fighter: FighterViewModel) =>
    renderFighterPressable(
      fighter,
      <>
        <View style={styles.tapeImageFrame}>
          {renderStanceImage(fighter, styles.tapeImage)}
        </View>
        {renderBadges(fighter)}
        {renderNameBlock(fighter)}
      </>,
      styles.tapeFighterCard,
    );

  const renderSpotlightFighter = (fighter: FighterViewModel, isLeft: boolean) =>
    renderFighterPressable(
      fighter,
      <>
        <View style={styles.spotlightImageFrame}>
          {renderStanceImage(fighter, styles.spotlightImage)}
        </View>

        <View style={styles.spotlightNamePlate}>
          {renderBadges(fighter)}
          {renderNameBlock(fighter)}
        </View>
      </>,
      [styles.spotlightFighter, isLeft && styles.spotlightLeftFighter],
    );

  const renderValue = (value: ComparisonValue, fighter: FighterViewModel) => (
    <Text style={[styles.valueText, fighter.isChampion && styles.championText]}>
      {formatComparisonValue(value)}
    </Text>
  );

  const renderFullStatRows = () => (
    <View style={styles.statList}>
      {rows.map((row, index) => (
        <View
          key={row.label}
          style={[styles.statRow, index === rows.length - 1 && styles.lastRow]}
        >
          <View style={styles.statValueCell}>
            {renderValue(row.leftValue, leftFighter)}
          </View>
          <View style={styles.statLabelCell}>
            <Text
              style={styles.statLabel}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
            >
              {row.label}
            </Text>
          </View>
          <View style={[styles.statValueCell]}>
            {renderValue(row.rightValue, rightFighter)}
          </View>
        </View>
      ))}
    </View>
  );

  const renderCornerCards = () => (
    <View style={styles.wrapper}>
      <View style={styles.cornerHeader}>
        {renderCornerFighter(leftFighter)}

        {renderCornerFighter(rightFighter)}
      </View>
      {renderFullStatRows()}
    </View>
  );

  const renderTaleOfTape = () => (
    <View style={[styles.wrapper, styles.tapeWrapper]}>
      <View style={styles.tapeContainer}>
        {renderTapeFighter(leftFighter)}
        {renderTapeFighter(rightFighter)}
      </View>
    </View>
  );

  const renderSpotlight = () => (
    <View style={styles.wrapper}>
      <View style={styles.spotlightStage}>
        {renderSpotlightFighter(leftFighter, true)}
        {renderSpotlightFighter(rightFighter, false)}
      </View>

      {renderFullStatRows()}
    </View>
  );

  const renderVariant = () => {
    switch (variant) {
      case "tale-of-tape":
        return renderTaleOfTape();
      case "spotlight":
        return renderSpotlight();
      case "corner-cards":
      default:
        return renderCornerCards();
    }
  };

  return (
    <View style={styles.container}>
      <HeadingTwo isDark={isDark}>Matchup Comparison</HeadingTwo>
      {renderVariant()}
    </View>
  );
}
export const matchupComparisonStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      width: "100%",
    },
    wrapper: {
      overflow: "hidden",
      width: "100%",
      borderWidth: 1,
      borderColor: Colors.midTone,
      borderRadius: 8,
    },
    badgesRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      minHeight: 18,
    },
    badge: {
      alignItems: "center",
      justifyContent: "center",
      minHeight: 18,
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 4,
    },
    winnerBadge: {
      backgroundColor: isDark ? Colors.dark.green : Colors.light.green,
    },
    championBadge: {
      backgroundColor: isDark ? Colors.dark.gold : Colors.light.gold,
    },
    badgeText: {
      fontFamily: Fonts.BOLD,
      fontSize: 9,
      lineHeight: 12,
      color: Colors.white,
      textAlign: "center",
    },
    winnerBackground: {
      backgroundColor: isDark
        ? Colors.dark.transparentGreen
        : Colors.light.transparentGreen,
    },
    championBorder: {
      borderColor: isDark ? Colors.dark.yellow : Colors.light.gold,
    },
    pressed: {
      opacity: 0.78,
    },
    disabled: {
      opacity: 0.72,
    },
    cornerHeader: {
      flexDirection: "row",
      alignItems: "stretch",
      justifyContent: "center",
      gap: 8,
      minHeight: 142,
    },
    cornerFighterCard: {
      flex: 1,
      alignItems: "center",
      justifyContent: "space-between",
      gap: 6,
      minWidth: 0,
      padding: 8,
    },
    cornerImageFrame: {
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      height: 74,
    },
    cornerImage: {
      width: "100%",
      height: "100%",
    },
    nameBlock: {
      alignItems: "center",
      justifyContent: "center",
      gap: 3,
      width: "100%",
      minHeight: 44,
    },
    fighterName: {
      width: "100%",
      fontFamily: Fonts.BOLD,
      fontSize: 13,
      lineHeight: 16,
      color: isDark ? Colors.dark.text : Colors.light.text,
      textAlign: "center",
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      width: "100%",
      minHeight: 18,
    },
    flag: {
      width: 22,
      height: 15,
    },
    recordText: {
      fontFamily: Fonts.MEDIUM,
      fontSize: 11,
      lineHeight: 14,
      color: isDark ? Colors.lightGray : Colors.darkGray,
      textAlign: "center",
    },

    statList: {
      width: "100%",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark
        ? Colors.dark.transparentWhite
        : Colors.transparentBlack,
      overflow: "hidden",
    },
    statRow: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 38,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark
        ? Colors.dark.transparentWhite
        : Colors.transparentBlack,
    },
    lastRow: {
      borderBottomWidth: 0,
    },
    statValueCell: {
      flex: 1,
      justifyContent: "center",
      minWidth: 0,
      minHeight: 38,
      paddingHorizontal: 7,
      paddingVertical: 5,
    },
    statLabelCell: {
      alignItems: "center",
      justifyContent: "center",
      width: 68,
      minHeight: 38,
      paddingHorizontal: 5,
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderLeftColor: isDark
        ? Colors.dark.transparentWhite
        : Colors.transparentBlack,
      borderRightColor: isDark
        ? Colors.dark.transparentWhite
        : Colors.transparentBlack,
    },
    statLabel: {
      fontFamily: Fonts.BOLD,
      fontSize: 11,
      color: isDark ? Colors.lightGray : Colors.darkGray,
      textAlign: "center",
      textTransform: "uppercase",
    },
    valueText: {
      fontFamily: Fonts.REGULAR,
      fontSize: 12,
      color: isDark ? Colors.dark.text : Colors.light.text,
      textAlign: "center",
    },

    championText: {
      fontFamily: Fonts.BOLD,
      color: isDark ? Colors.dark.gold : Colors.light.gold,
    },

    tapeWrapper: {
      padding: 8,
    },
    tapeContainer: {
      flexDirection: "row",
      alignItems: "stretch",
      gap: 7,
      width: "100%",
      minHeight: 296,
    },
    tapeFighterCard: {
      flex: 1,
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      minWidth: 0,
      paddingHorizontal: 6,
      paddingVertical: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? Colors.dark.icon : Colors.light.icon,
      borderRadius: 8,
      backgroundColor: isDark
        ? Colors.dark.transparentItemBackground
        : Colors.light.transparentItemBackground,
    },
    tapeImageFrame: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      minHeight: 160,
    },
    tapeImage: {
      width: "100%",
      height: "100%",
    },
    spotlightStage: {
      flexDirection: "row",
      alignItems: "stretch",
      minHeight: 220,
    },
    spotlightFighter: {
      flex: 1,
      minWidth: 0,
      overflow: "hidden",
    },
    spotlightLeftFighter: {
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: isDark ? Colors.dark.icon : Colors.light.icon,
    },
    spotlightImageFrame: {
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      height: 150,
      paddingHorizontal: 6,
      paddingTop: 8,
    },
    spotlightImage: {
      width: "100%",
      height: "100%",
    },
    spotlightNamePlate: {
      justifyContent: "center",
      minHeight: 68,
      paddingHorizontal: 8,
      paddingVertical: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: isDark
        ? Colors.dark.transparentWhite
        : Colors.transparentBlack,
    },
  });
