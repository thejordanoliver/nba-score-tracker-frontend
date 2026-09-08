import HomeAwayTabBar, {
  HomeAwayTabValue,
} from "@/components/TabBars/HomeAwayTabBar";
import type { FootballDrive } from "@/hooks/FootballHooks/useFootballGameDetails";
import { Colors } from "constants/styles";
import { useCallback, useMemo, useState } from "react";
import type { ImageSourcePropType } from "react-native";
import { StyleSheet, View } from "react-native";
import HeadingTwo from "../../../Headings/HeadingTwo";
import DrivesList from "./DrivesList";

type League = "nfl" | "cfb" | string;

type TeamTab = Exclude<HomeAwayTabValue, "all">;

type Props = {
  previousDrives?: FootballDrive[] | null;
  currentDrives?: FootballDrive[] | null;
  loading?: boolean;
  error?: string | null;
  awayLogo: ImageSourcePropType;
  homeLogo: ImageSourcePropType;
  awayCode: string;
  homeCode: string;
  homeId: number;
  awayId: number;
  isDark: boolean;
  league?: League;
  state?: string;
};

type DriveTeam = {
  id: string | null;
  label: string;
  logo: ImageSourcePropType;
};

const normalizeId = (id?: number | string | null): string | null => {
  if (id === null || id === undefined || id === "") {
    return null;
  }

  return String(id);
};

export default function TeamDrives({
  previousDrives = [],
  currentDrives = [],
  loading = false,
  error = null,
  awayId,
  homeId,
  awayLogo,
  homeLogo,
  awayCode,
  homeCode,
  isDark,
  league = "nfl",
  state,
}: Props) {
  const styles = TeamDrivesStyles(isDark);

  const [selectedTab, setSelectedTab] = useState<TeamTab>("away");

  const previous = useMemo(() => {
    return Array.isArray(previousDrives) ? previousDrives : [];
  }, [previousDrives]);

  const current = useMemo(() => {
    return Array.isArray(currentDrives) ? currentDrives : [];
  }, [currentDrives]);

  const teams = useMemo<Record<TeamTab, DriveTeam>>(
    () => ({
      away: {
        id: normalizeId(awayId),
        label: awayCode || "Away",
        logo: awayLogo,
      },
      home: {
        id: normalizeId(homeId),
        label: homeCode || "Home",
        logo: homeLogo,
      },
    }),
    [awayCode, awayId, awayLogo, homeCode, homeId, homeLogo],
  );

  const filterDrivesByTeam = useCallback(
    (drives: FootballDrive[], tab: TeamTab): FootballDrive[] => {
      const selectedTeam = teams[tab];

      if (!selectedTeam.id) {
        return [];
      }

      return drives.filter((drive) => {
        const driveTeamId = normalizeId(drive.team?.id);

        return driveTeamId === selectedTeam.id;
      });
    },
    [teams],
  );

  const selectedCurrentDrives = useMemo(() => {
    return filterDrivesByTeam(current, selectedTab);
  }, [current, filterDrivesByTeam, selectedTab]);

  const selectedPreviousDrives = useMemo(() => {
    return filterDrivesByTeam(previous, selectedTab);
  }, [previous, filterDrivesByTeam, selectedTab]);

  const handleTabPress = useCallback((tab: HomeAwayTabValue) => {
    if (tab === "all") {
      return;
    }

    setSelectedTab(tab);
  }, []);

  if (state !== "post" && state !== "in") {
    return null;
  }

  return (
    <View>
      <HeadingTwo isDark={isDark}>Drives</HeadingTwo>

      <View style={styles.wrapper}>
        <HomeAwayTabBar
          awayTeam={{
            id: awayId,
            name: awayCode || "AWAY",
            logo: awayLogo,
          }}
          homeTeam={{
            id: homeId,
            name: homeCode || "HOME",
            logo: homeLogo,
          }}
          selected={selectedTab}
          onTabPress={handleTabPress}
          showAllTab={false}
          isDark={isDark}
        />

        <DrivesList
          previousDrives={selectedPreviousDrives}
          currentDrives={selectedCurrentDrives}
          loading={loading}
          error={error}
          isDark={isDark}
          league={league}
        />
      </View>
    </View>
  );
}

const TeamDrivesStyles = (isDark: boolean) =>
  StyleSheet.create({
    wrapper: {
      borderWidth: 1,
      borderColor: Colors.midTone,
      borderRadius: 8,
      overflow: "hidden",
    },
  });
