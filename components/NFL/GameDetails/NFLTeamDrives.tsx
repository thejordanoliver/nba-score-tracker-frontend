import { getNFLTeamsLogo } from "constants/teamsNFL";
import { useEffect, useMemo, useState } from "react";
import { Image, StyleSheet, Text, useColorScheme, View } from "react-native";
import HeadingTwo from "../../Headings/HeadingTwo";
import FixedWidthTabBar, { getLabelStyle } from "../FixedWidthTabBar";
import NFLDrivesList, { Drive } from "./NFLDrivesList";

type Props = {
  previousDrives?: Drive[] | null;
  currentDrives?: Drive[] | null;
  loading?: boolean;
  error?: string | null;
  awayTeamAbbr?: string;
  homeTeamAbbr?: string;
  lighter?: boolean; // <-- add lighter
};

export default function NFLTeamDrives({
  previousDrives = [],
  currentDrives = [],
  loading = false,
  error = null,
  awayTeamAbbr,
  homeTeamAbbr,
  lighter = false,
}: Props) {
  const isDark = useColorScheme() === "dark";
  const styles = getStyles(isDark);

  const prev = Array.isArray(previousDrives) ? previousDrives : [];
  const curr = Array.isArray(currentDrives) ? currentDrives : [];
  const allDrives = useMemo(() => [...curr, ...prev], [curr, prev]);

  // Tab ordering: away first, home second, then any others
  const teams = useMemo(() => {
    const uniqueAbbrs = Array.from(
      new Set(allDrives.map((d) => d?.team?.abbreviation).filter(Boolean))
    );
    const tabs: string[] = [];
    if (awayTeamAbbr && uniqueAbbrs.includes(awayTeamAbbr.toUpperCase()))
      tabs.push(awayTeamAbbr.toUpperCase());
    if (
      homeTeamAbbr &&
      uniqueAbbrs.includes(homeTeamAbbr.toUpperCase()) &&
      homeTeamAbbr.toUpperCase() !== awayTeamAbbr?.toUpperCase()
    )
      tabs.push(homeTeamAbbr.toUpperCase());
    uniqueAbbrs.forEach((abbr) => {
      if (!tabs.includes(abbr)) tabs.push(abbr);
    });
    return tabs;
  }, [allDrives, awayTeamAbbr, homeTeamAbbr]);

  const [selectedTeam, setSelectedTeam] = useState<string>(teams[0] ?? "");

  useEffect(() => {
    if (!selectedTeam || !teams.includes(selectedTeam)) {
      setSelectedTeam(teams[0] ?? "");
    }
  }, [teams, selectedTeam]);

  const teamDrives = useMemo(
    () => allDrives.filter((d) => d?.team?.abbreviation === selectedTeam),
    [allDrives, selectedTeam]
  );

  if (!loading && allDrives.length === 0) return <></>;

  return (
    <View style={styles.container}>
      <HeadingTwo lighter={lighter}>Drives</HeadingTwo>

      <FixedWidthTabBar
        tabs={teams}
        selected={selectedTeam}
        onTabPress={setSelectedTeam}
        awayTeamAbbr={awayTeamAbbr}
        homeTeamAbbr={homeTeamAbbr}
        lighter={lighter} // <-- pass lighter
        renderLabel={(abbr, isSelected) => {
          const logo = getNFLTeamsLogo(abbr, isDark);
          return (
            <View style={styles.tabLabel}>
              {logo && (
                <Image
                  source={logo}
                  style={[styles.logo, { opacity: isSelected ? 1 : 0.5 }]}
                  resizeMode="contain"
                />
              )}
              <Text
                style={getLabelStyle(isDark, isSelected, lighter, {
                  fontSize: 12,
                  opacity: isSelected ? 1 : 0.5, // ← added text opacity
                })}
              >
                {abbr}
              </Text>
            </View>
          );
        }}
      />

      <NFLDrivesList
        previousDrives={[]}
        currentDrives={teamDrives}
        loading={loading}
        error={error}
        lighter={lighter} // <-- pass lighter
      />
    </View>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      marginTop: 10,
    },
    tabLabel: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    logo: {
      width: 28,
      height: 28,
    },
  });
