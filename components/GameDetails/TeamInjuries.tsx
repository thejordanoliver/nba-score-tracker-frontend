import { Fonts } from "constants/fonts";
import { teams } from "constants/teams";
import { TeamInjury } from "hooks/useGameDetails";
import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, useColorScheme, View } from "react-native";
import FixedWidthTabBar from "../FixedWidthTabBar";
import HeadingTwo from "../Headings/HeadingTwo";
import GameInjuries from "./TeamInjuriesList";

type Props = {
  injuries: TeamInjury[];
  lighter?: boolean;
};

export default function TeamInjuriesTab({ injuries, lighter = false }: Props) {
  const isDark = useColorScheme() === "dark";
  const [selectedTeam, setSelectedTeam] = useState<string>("");

  // Reorder so away team is first
  const reorderedInjuries =
    injuries?.length === 2 ? [injuries[1], injuries[0]] : injuries ?? [];

  // Map injuries to tabs with logo info
  const tabs = reorderedInjuries.map((inj) => {
    const matchedTeam = teams.find(
      (t) => t.fullName.toLowerCase() === inj.team.displayName.toLowerCase()
    );
    return {
      displayName: inj.team.displayName,
      abbreviation: inj.team.abbreviation,
      logo: matchedTeam?.logo || null,
      logoLight: matchedTeam?.logoLight || null,
      code: matchedTeam?.code || "",
    };
  });

  // Set initial selected team after tabs are ready
  useEffect(() => {
    if (!selectedTeam && tabs.length > 0) {
      setSelectedTeam(tabs[0].displayName);
    }
  }, [tabs]);

  const currentInjuries = reorderedInjuries.find(
    (t) => t.team.displayName === selectedTeam
  );

  // ✅ Now safe to bail out
  if (!injuries || injuries.length === 0 || !currentInjuries) {
    return null;
  }

  return (
    <View>
      <HeadingTwo lighter={lighter}>Injury Report</HeadingTwo>

      <View style={{ alignSelf: "center", marginBottom: 12 }}>
        <FixedWidthTabBar
          tabs={tabs.map((t) => t.displayName)}
          selected={selectedTeam}
          onTabPress={setSelectedTeam}
          lighter={lighter}
          renderLabel={(tabName, isSelected) => {
            const tab = tabs.find((t) => t.displayName === tabName);
            if (!tab) return null;

            const textColor = lighter
              ? "#fff"
              : isSelected
              ? isDark
                ? "#fff"
                : "#1d1d1d"
              : isDark
              ? "#888"
              : "rgba(0,0,0,0.5)";

            return (
              <View style={styles.tabLabel}>
                {tab.logo && (
                  <Image
                    source={isDark ? tab.logoLight || tab.logo : tab.logo}
                    style={[
                      styles.logo,
                      { width: 20, height: 20, opacity: isSelected ? 1 : 0.5 },
                    ]}
                    resizeMode="contain"
                  />
                )}
                <Text
                  style={{
                    color: textColor,
                    fontSize: 16,
                    marginLeft: tab.logo ? 4 : 0,
                    fontFamily: Fonts.OSMEDIUM,
                  }}
                >
                  {tab.code}
                </Text>
              </View>
            );
          }}
        />
      </View>

      <GameInjuries injuries={[currentInjuries]} lighter={lighter} />
    </View>
  );
}

const styles = StyleSheet.create({
  tabLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  logo: {
    width: 20,
    height: 20,
  },
});
