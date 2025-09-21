import { ReactNode } from "react";
import { Image, Text, View } from "react-native";
import { teams, teamsById } from "../constants/teams";
import { Fonts } from "constants/fonts";

type TeamColors = {
  id?: string | number;
  fullName?: string;
  color?: string;
  secondaryColor?: string;
  constantLight?: string;
  constantTextLight?: string;
  constantBlack?: string;
};

type Props = {
  label: string;
  value: string | number | ReactNode;
  image?: any;
  isDark: boolean;
  team: TeamColors;
  teamId?: string;
  teamName?: string;
  backgroundColor?: string;
  textColor?: string; // color for the value text
  labelColor?: string; // color for the label text
};

export default function InfoCard({
  label,
  value,
  image,
  isDark,
  team,
  teamId,
  teamName,
  backgroundColor,
  textColor,
  labelColor,
}: Props) {
  // Determine team colors from ID or name
  let teamObj: TeamColors | undefined;

  if (teamId && teamsById[teamId]) {
    teamObj = teamsById[teamId];
  }

  if (!teamObj && teamName) {
    teamObj = teams.find(
      (t) => t.fullName.toLowerCase() === teamName.toLowerCase()
    );
  }

  if (!teamObj && team.fullName) {
    teamObj = teams.find(
      (t) => t.fullName?.toLowerCase() === team.fullName?.toLowerCase()
    );
  }

  if (!teamObj) {
    teamObj = team; // fallback to provided team object
  }

  // Define whether label requires wrapping
  const isConferenceChampionships = label === "Conference Championships";

  // Fallback text colors logic
  const resolvedLabelColor = labelColor ?? (isDark ? "#fff" : "#000");
  const resolvedTextColor = textColor ?? (isDark ? "#fff" : "#fff");

  return (
    <>
      <Text
        style={{
          color: resolvedLabelColor,
          fontFamily: Fonts.OSMEDIUM,
          fontSize: 20,
          paddingBottom: 4,
          marginBottom: 8,
          borderBottomWidth: 0.5,
          borderBottomColor: isDark ? "#ccc" : "#444",
        }}
      >
        {label}
      </Text>

      <View
        style={{
          flexDirection: "row",
          alignItems: isConferenceChampionships ? "flex-start" : "center",
          backgroundColor,
          borderRadius: 8,
          paddingHorizontal: 16,
          paddingVertical: 12,
          marginBottom: 12,
          width: "100%",
          minHeight: 80,
          flexWrap: isConferenceChampionships ? "wrap" : "nowrap",
        }}
      >
        {image && (
          <View
            style={{
              borderRadius: 100,
              justifyContent: "center",
              alignItems: "center",
              marginRight: 12,
              overflow: "hidden",
            }}
          >
            <Image
              source={image}
              style={{
                width: 54,
                height: 54,
                paddingTop: 4,
                resizeMode: "contain",
                backgroundColor: isDark ? "#444" : "#ddd",
              }}
            />
          </View>
        )}
        <Text
          style={{
            fontFamily: Fonts.OSREGULAR,
            fontSize: 16,
            color: resolvedTextColor,
            flexShrink: 1,
            flex: 1,
            flexWrap: isConferenceChampionships ? "wrap" : "nowrap",
          }}
        >
          {value}
        </Text>
      </View>
    </>
  );
}
