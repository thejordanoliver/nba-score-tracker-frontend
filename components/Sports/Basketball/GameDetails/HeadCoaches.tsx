import HeadingTwo from "@/components/Headings/HeadingTwo";
import { Colors, Fonts } from "@/constants/styles";
import { Coach } from "@/hooks/useTeams";
import { calculateAge } from "@/utils/dateUtils";
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

type CoachesProps = {
  homeCoach: Coach | null | undefined;
  awayCoach: Coach | null | undefined;
  homeLogo: any;
  awayLogo: any;
  homeCode: string;
  awayCode: string;
  isDark: boolean;
  state: string
};

export default function HeadCoaches({
  homeCoach,
  awayCoach,
  homeLogo,
  awayLogo,
  homeCode,
  awayCode,
  isDark,
  state
}: CoachesProps) {
  const styles = coachesStyles(isDark);

  const formatExperience = (coach: Coach | null | undefined) => {
    const experience = coach?.experience;

    if (experience === null || experience === undefined) {
      return "Unknown";
    }

    if (experience === 0) {
      return "1st Season";
    }

    if (experience === 1) {
      return "1 Season";
    }

    return `${experience} Seasons`;
  };

  const getCoachName = (coach: Coach | null | undefined) => {
    const name = `${coach?.firstName ?? ""} ${coach?.lastName ?? ""}`.trim();

    return name || "Coach";
  };

  const getCoachAge = (coach: Coach | null | undefined) => {
    const age = calculateAge(coach?.birthDate);

    return age === null ? "--" : String(age);
  };

  const getCoachRecord = (coach: Coach | null | undefined) =>
    coach?.record || "--";

  const renderCoachHeader = (
    coach: Coach | null | undefined,
    teamName: string,
    teamLogo: any,
    side: "away" | "home",
  ) => {
    const isHome = side === "home";

    return (
      <View style={[styles.coachHeader, isHome && styles.homeCoachHeader]}>
        {!isHome && <Image source={teamLogo} style={styles.teamLogo} />}
        <View style={[styles.coachCopy, isHome && styles.homeCoachCopy]}>
          <Text
            style={[styles.coachName, isHome && styles.homeText]}
            numberOfLines={1}
            minimumFontScale={0.2}
            adjustsFontSizeToFit
          >
            {getCoachName(coach)}
          </Text>
          {teamName && (
            <Text style={[styles.teamName, isHome && styles.homeText]}>
              {teamName}
            </Text>
          )}
        </View>
        {isHome && <Image source={teamLogo} style={styles.teamLogo} />}
      </View>
    );
  };

  const renderComparisonRow = (
    label: string,
    awayValue: string,
    homeValue: string,
    isLast = false,
  ) => (
    <View style={[styles.comparisonRow, isLast && styles.lastRow]}>
      <Text
        style={[styles.valueText, styles.awayValue]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {awayValue}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text
        style={[styles.valueText, styles.homeValue]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {homeValue}
      </Text>
    </View>
  );

  if (state === "post") return null

  return (
    <View style={styles.container}>
      <HeadingTwo isDark={isDark}>Head Coaches</HeadingTwo>
      <View style={styles.wrapper}>
        <View style={[styles.comparisonRow, styles.headerRow]}>
          <View style={styles.sideCell}>
            {renderCoachHeader(awayCoach, awayCode, awayLogo, "away")}
          </View>
          <Text style={styles.statLabel}>Coach</Text>
          <View style={styles.sideCell}>
            {renderCoachHeader(homeCoach, homeCode, homeLogo, "home")}
          </View>
        </View>
        {renderComparisonRow(
          "Experience",
          formatExperience(awayCoach),
          formatExperience(homeCoach),
        )}
        {renderComparisonRow(
          "Record",
          getCoachRecord(awayCoach),
          getCoachRecord(homeCoach),
        )}
        {renderComparisonRow(
          "Age",
          getCoachAge(awayCoach),
          getCoachAge(homeCoach),
          true,
        )}
      </View>
    </View>
  );
}

const coachesStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1 },

    wrapper: {
      borderWidth: 1,
      borderColor: Colors.midTone,
      borderRadius: 8,
      overflow: "hidden",
    },

    comparisonRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      minHeight: 44,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? Colors.darkGray : Colors.lightGray,
    },

    headerRow: {
      minHeight: 64,
    },

    lastRow: {
      borderBottomWidth: 0,
    },

    sideCell: {
      flex: 1,
      minWidth: 0,
    },

    coachHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      minWidth: 0,
    },

    homeCoachHeader: {
      justifyContent: "flex-end",
    },

    coachCopy: {
      flex: 1,
      minWidth: 0,
    },

    homeCoachCopy: {
      alignItems: "flex-end",
    },

    coachName: {
      fontFamily: Fonts.MEDIUM,
      fontSize: 15,
      lineHeight: 18,
      color: isDark ? Colors.white : Colors.black,
    },

    teamName: {
      fontFamily: Fonts.REGULAR,
      fontSize: 12,
      lineHeight: 15,
      color: Colors.midTone,
    },

    statLabel: {
      width: 76,
      fontFamily: Fonts.REGULAR,
      fontSize: 10,
      color: Colors.midTone,
      textAlign: "center",
      textTransform: "uppercase",
    },

    valueText: {
      flex: 1,
      fontFamily: Fonts.REGULAR,
      fontSize: 14,
      lineHeight: 18,
      color: isDark ? Colors.white : Colors.black,
    },

    awayValue: {
      textAlign: "left",
    },

    homeValue: {
      textAlign: "right",
    },

    homeText: {
      textAlign: "right",
    },

    teamLogo: {
      width: 32,
      height: 32,
      resizeMode: "contain",
    },
  });
