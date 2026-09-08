import { Colors, Fonts } from "constants/styles";
import { usePreferences } from "contexts/PreferencesContext";
import { ReactNode } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { soccerTeams } from "@/constants/teamsSOCC";
import { teams } from "constants/teams";
import { cbbTeams } from "constants/teamsCBB";
import { cfbTeams } from "constants/teamsCFB";
import { mlbTeams } from "constants/teamsMLB";
import { nflTeams } from "constants/teamsNFL";
import { nhlTeams } from "constants/teamsNHL";

type TeamColors = {
  id?: string | number | null;
  name?: string;
  fullName?: string;
  color?: string | null;
  secondaryColor?: string | null;
};

type Props = {
  label: string;
  value: string | number | ReactNode | string[] | number[];
  image?: string | null;
  team: TeamColors;
  teamId?: string;
  teamName?: string;
};

const allTeams: TeamColors[] = [
  ...teams,
  ...nflTeams,
  ...cfbTeams,
  ...mlbTeams,
  ...nhlTeams,
  ...cbbTeams,
  ...soccerTeams,
];

const findTeam = (
  teamId?: string,
  teamName?: string,
  fallback?: TeamColors,
) => {
  let teamObj: TeamColors | undefined;

  if (teamId) {
    teamObj = allTeams.find((t) => String(t.id) === String(teamId));
  }

  if (!teamObj && teamName) {
    const clean = teamName.toLowerCase();
    teamObj = allTeams.find(
      (t) =>
        t.name?.toLowerCase() === clean || t.fullName?.toLowerCase() === clean,
    );
  }

  if (!teamObj && fallback?.fullName) {
    const clean = fallback.fullName.toLowerCase();
    teamObj = allTeams.find(
      (t) =>
        t.name?.toLowerCase() === clean || t.fullName?.toLowerCase() === clean,
    );
  }

  return teamObj ?? fallback;
};

export default function InfoCard({
  label,
  value,
  image,
  team,
  teamId,
  teamName,
}: Props) {
  const teamObj = findTeam(teamId, teamName, team) ?? {
    color: Colors.midTone,
  };

  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";

  const styles = InfoCardStyles(isDark, teamObj);

  let formattedValue: string | ReactNode;

  if (Array.isArray(value)) {
    formattedValue = value.join(", ");
  } else {
    formattedValue = value;
  }

  return (
    <>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.cardContainer}>
        {image && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: image }} style={styles.image} />
          </View>
        )}

        <Text style={styles.value}>{formattedValue}</Text>
      </View>
    </>
  );
}

export const InfoCardStyles = (isDark: boolean, teamObj: TeamColors) =>
  StyleSheet.create({
    label: {
      marginBottom: 8,
      paddingBottom: 4,
      borderBottomWidth: 0.5,
      borderBottomColor: isDark ? Colors.lightGray : Colors.darkGray,
      fontFamily: Fonts.MEDIUM,
      fontSize: 20,
      color: isDark ? Colors.white : Colors.black,
    },

    cardContainer: {
      flexDirection: "row",
      alignItems: "center",
      width: "100%",
      minHeight: 80,
      marginBottom: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: Colors.midTone,
      borderRadius: 8,
      backgroundColor: teamObj?.color ?? Colors.midTone,
    },

    imageContainer: {
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
      borderWidth: 1,
      borderColor: Colors.white,
      borderRadius: 100,
      overflow: "hidden",
      resizeMode: "contain",
    },

    image: {
      width: 54,
      height: 54,
      paddingTop: 4,
    },

    value: {
      flex: 1,
      flexShrink: 1,
      fontFamily: Fonts.REGULAR,
      fontSize: 16,
      color: Colors.white,
    },
  });
