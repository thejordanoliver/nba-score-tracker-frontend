// components/CFB/RecruitCard.tsx
import { getCBBTeamLogo } from "@/constants/teamsCBB";
import { RecruitPredictedSchool } from "@/hooks/RecruitHooks/useAllRecruits";
import { Recruit } from "@/types/recruiting/players";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts, activeOpacity } from "constants/styles";
import { getCFBTeamLogo } from "constants/teamsCFB";
import { usePreferences } from "contexts/PreferencesContext";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  recruit: Recruit;
  league: "cbb" | "cfb";
  index: number;
};

type LogoDisplayItem = {
  teamId: number;
  teamName: string;
  logo: ImageSourcePropType;
};

function getSortedPredictions(
  predictions: RecruitPredictedSchool[] | undefined,
) {
  if (!Array.isArray(predictions)) {
    return [];
  }

  return predictions
    .filter((prediction) => prediction?.team_name)
    .sort((a, b) => {
      const percentageA = a.percentage ?? -1;
      const percentageB = b.percentage ?? -1;

      if (percentageB !== percentageA) {
        return percentageB - percentageA;
      }

      const confidenceA = a.confidence_score ?? -1;
      const confidenceB = b.confidence_score ?? -1;

      return confidenceB - confidenceA;
    });
}

function getTopTiedPredictions(
  predictions: RecruitPredictedSchool[],
): RecruitPredictedSchool[] {
  if (!predictions.length) {
    return [];
  }

  const topPercentage = predictions[0]?.percentage;

  if (topPercentage === null || topPercentage === undefined) {
    return [predictions[0]];
  }

  return predictions.filter(
    (prediction) => prediction.percentage === topPercentage,
  );
}

export default function RecruitCard({ recruit, index, league }: Props) {
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = useMemo(() => recruitCardStyles(isDark), [isDark]);
  const router = useRouter();

  const sortedPredictions = useMemo(
    () => getSortedPredictions(recruit.predicted_schools),
    [recruit.predicted_schools],
  );

  const topTiedPredictions = useMemo(
    () => getTopTiedPredictions(sortedPredictions),
    [sortedPredictions],
  );

  const isCommittedOrSigned = recruit.is_signed || recruit.is_committed;

  const isPredictionTie =
    !isCommittedOrSigned &&
    recruit.has_prediction &&
    topTiedPredictions.length > 1;

  const logoItems = useMemo<LogoDisplayItem[]>(() => {
    const primaryPrediction = sortedPredictions[0];

    if (isCommittedOrSigned) {
      const committedTeamId = recruit.committed_team_id;

      if (!committedTeamId) {
        return [];
      }

      const logo =
        league === "cfb"
          ? getCFBTeamLogo(committedTeamId, isDark)
          : getCBBTeamLogo(committedTeamId, isDark);

      if (!logo) {
        return [];
      }

      return [
        {
          teamId: committedTeamId,
          teamName: recruit.committed_team_name || "Team",
          logo,
        },
      ];
    }

    if (isPredictionTie) {
      return topTiedPredictions
        .slice(0, 2)
        .map((prediction) => {
          if (!prediction.team_id) {
            return null;
          }

          const logo = getCFBTeamLogo(prediction.team_id, isDark);

          if (!logo) {
            return null;
          }

          return {
            teamId: prediction.team_id,
            teamName: prediction.team_name,
            logo,
          };
        })
        .filter((item): item is LogoDisplayItem => Boolean(item));
    }

    const teamId = primaryPrediction?.team_id || recruit.predicted_team_id;

    if (!teamId) {
      return [];
    }

    const logo =
      league === "cfb"
        ? getCFBTeamLogo(teamId, isDark)
        : getCBBTeamLogo(teamId, isDark);

    if (!logo) {
      return [];
    }

    return [
      {
        teamId: teamId,
        teamName:
          recruit.predicted_team_name || primaryPrediction?.team_name || "Team",
        logo,
      },
    ];
  }, [
    isDark,
    isCommittedOrSigned,
    isPredictionTie,
    recruit.committed_team_id,
    recruit.committed_team_name,
    recruit.predicted_team_id,
    recruit.predicted_team_name,
    sortedPredictions,
    topTiedPredictions,
    league,
  ]);

  const slideX = useRef(new Animated.Value(70)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideX, {
        toValue: 0,
        duration: 650,
        delay: index * 60,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: 1,
        duration: 650,
        delay: index * 60,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, index, slideX]);

  const starCount = recruit.stars ?? 0;
  const isFiveStar = starCount === 5;
  const avatar = recruit.image_url;

  const nationalRankLabel =
    recruit.national_rank === null ? "NR" : `#${recruit.national_rank}`;

  const nationalRankValue = recruit.national_rank ?? "—";
  const positionRankValue = recruit.position_rank ?? "—";
  const stateRankValue = recruit.state_rank ?? "—";
  const scoreValue = recruit.score ?? "—";
  const highSchoolValue = recruit.high_school ?? "High school unavailable";
  const heightValue = recruit.height ?? "—";
  const weightValue = recruit.weight ? `${recruit.weight} lbs` : "—";

  return (
    <View style={styles.cardWrapper}>
      <TouchableOpacity
        activeOpacity={activeOpacity}
        onPress={() =>
          router.push({
            pathname: "/recruit/[id]",
            params: {
              id: recruit.id,
              teamId: recruit.committed_team_id,
              league: league,
            },
          })
        }
      >
        {logoItems.length > 0 && (
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: fade,
                transform: [{ translateX: slideX }],
              },
            ]}
          >
            {logoItems.length > 1 ? (
              <View style={styles.splitLogoStack}>
                {logoItems.map((item, logoIndex) => (
                  <View
                    key={`${item.teamId}-${logoIndex}`}
                    style={styles.splitLogoPane}
                  >
                    <Image
                      source={item.logo}
                      style={[
                        styles.backgroundLogo,
                        styles.splitBackgroundLogo,
                      ]}
                      resizeMode="contain"
                    />
                  </View>
                ))}
              </View>
            ) : (
              <Image
                source={logoItems[0].logo}
                style={styles.backgroundLogo}
                resizeMode="contain"
              />
            )}
          </Animated.View>
        )}

        <LinearGradient
          colors={
            isDark
              ? [
                  "rgba(29,29,29,0.9)",
                  "rgba(29,29,29,1)",
                  "rgba(29,29,29,1)",
                  "rgba(29,29,29,0.7)",
                  "rgba(29,29,29,0.3)",
                  "rgba(0,0,0,0)",
                ]
              : [
                  "rgba(255,255,255,0.9)",
                  "rgba(255,255,255,1)",
                  "rgba(255,255,255,1)",
                  "rgba(255,255,255,0.7)",
                  "rgba(255,255,255,0.3)",
                  "rgba(255,255,255,0)",
                ]
          }
          locations={[0, 0.35, 0.6, 0.75, 0.85, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardGradient}
        />

        <View style={styles.cardContent}>
          <View style={styles.row}>
            <View style={styles.playerHeader}>
              <View style={styles.avatarContainer}>
                {avatar && (
                  <Image source={{ uri: avatar }} style={styles.avatar} />
                )}
              </View>

              <View style={styles.namePosition}>
                <Text style={styles.name} numberOfLines={1}>
                  {recruit.name}
                </Text>

                <Text style={styles.positionText}>
                  {recruit.position ?? "—"}
                </Text>
              </View>
            </View>

            <View style={styles.rankingBadge}>
              <BlurView intensity={100} style={StyleSheet.absoluteFill} />
              <Text
                style={[
                  styles.rankingText,
                  isFiveStar && {
                    color: isDark ? Colors.dark.gold : Colors.light.gold,
                  },
                ]}
              >
                {nationalRankLabel}
              </Text>
            </View>
          </View>

          <View style={styles.contentRow}>
            <Text style={styles.subText}>Nat {nationalRankValue}</Text>

            <View style={styles.divider} />

            <Text style={styles.subText}>Pos {positionRankValue}</Text>

            <View style={styles.divider} />

            <Text style={styles.subText}>St {stateRankValue}</Text>
          </View>

          <View style={styles.contentRow}>
            {[...Array(5)].map((_, starIndex) => {
              const filled = starIndex < starCount;

              return (
                <Ionicons
                  key={starIndex}
                  name={filled ? "star" : "star-outline"}
                  size={16}
                  color={
                    filled
                      ? isDark
                        ? Colors.dark.gold
                        : Colors.light.gold
                      : isDark
                        ? Colors.lightGray
                        : Colors.darkGray
                  }
                  style={styles.star}
                />
              );
            })}

            <View style={styles.divider} />

            <Text style={styles.subText}>{scoreValue}</Text>
          </View>

          <View style={styles.contentRow}>
            <Text
              style={[styles.subText, styles.highSchoolText]}
              numberOfLines={1}
            >
              {highSchoolValue}
            </Text>

            <View style={styles.divider} />

            <Text style={styles.subText}>{heightValue}</Text>

            <View style={styles.divider} />

            <Text style={styles.subText}>{weightValue}</Text>
          </View>

          {recruit.is_signed && (
            <Text style={styles.commitText}>
              Signed: {recruit.committed_team_name ?? "Unknown team"}
            </Text>
          )}

          {recruit.is_committed && !recruit.is_signed && (
            <Text style={styles.commitText}>
              Committed: {recruit.committed_team_name ?? "Unknown team"}
            </Text>
          )}

          {!isCommittedOrSigned && (
            <Text style={styles.uncommittedText}>Uncommitted</Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const recruitCardStyles = (isDark: boolean) =>
  StyleSheet.create({
    cardWrapper: {
      position: "relative",
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? Colors.darkGray : Colors.lightGray,
      overflow: "hidden",
    },

    logoContainer: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      alignItems: "flex-end",
      justifyContent: "center",
      width: "45%",
      overflow: "hidden",
    },

    splitLogoStack: {
      width: "100%",
      height: "100%",
      overflow: "hidden",
    },

    splitLogoPane: {
      flex: 1,
      alignItems: "flex-end",
      justifyContent: "center",
      overflow: "hidden",
    },

    backgroundLogo: {
      height: "155%",
      aspectRatio: 1,
      marginRight: -40,
      opacity: 0.55,
    },

    splitBackgroundLogo: {
      height: "190%",
      marginRight: -34,
      opacity: 0.48,
    },

    cardGradient: {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      width: "120%",
    },

    cardContent: {
      paddingHorizontal: 12,
      paddingVertical: 8,
    },

    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    playerHeader: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
      paddingRight: 8,
    },

    namePosition: {
      flex: 1,
      flexDirection: "row",
      alignItems: "baseline",
    },

    avatarContainer: {
      width: 50,
      height: 50,
      marginRight: 8,
      borderWidth: 1,
      borderColor: isDark ? Colors.darkGray : Colors.lightGray,
      borderRadius: 25,
      backgroundColor: isDark ? Colors.darkGray : Colors.lightGray,
      overflow: "hidden",
    },

    avatar: {
      width: "100%",
      height: "100%",
    },

    avatarFallback: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },

    name: {
      flexShrink: 1,
      fontFamily: Fonts.BOLD,
      fontSize: 20,
      color: isDark ? Colors.dark.white : Colors.light.black,
    },

    positionText: {
      marginLeft: 6,
      fontFamily: Fonts.BOLD,
      fontSize: 14,
      color: isDark ? Colors.lightGray : Colors.darkGray,
    },

    rankingBadge: {
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
      width: 44,
      height: 44,
      borderWidth: 1,
      borderColor: isDark ? Colors.darkGray : Colors.lightGray,
      borderRadius: 999,
      borderCurve: "circular",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3,
      elevation: 4,
    },

    rankingText: {
      fontFamily: Fonts.BOLD,
      fontSize: 18,
      color: isDark ? Colors.white : Colors.black,
    },

    contentRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },

    highSchoolText: {
      flexShrink: 1,
    },

    star: {
      marginRight: 2,
    },

    divider: {
      width: 1,
      height: 18,
      marginHorizontal: 6,
      backgroundColor: isDark ? Colors.lightGray : Colors.darkGray,
    },

    subText: {
      fontFamily: Fonts.REGULAR,
      fontSize: 14,
      color: isDark ? Colors.dark.white : Colors.light.black,
    },

    commitText: {
      fontFamily: Fonts.BOLD,
      fontSize: 16,
      color: isDark ? Colors.dark.leafGreen : Colors.light.green,
    },

    uncommittedText: {
      marginTop: 8,
      fontFamily: Fonts.BOLD,
      fontSize: 15,
      color: isDark ? Colors.dark.yellow : Colors.light.yellow,
    },
  });
