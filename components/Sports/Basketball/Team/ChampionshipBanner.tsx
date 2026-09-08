import { getWCBBTeam } from "@/constants/teamsWCBB";
import { usePreferences } from "@/contexts/PreferencesContext";
import { Championships } from "@/hooks/useTeams";
import Fill from "assets/banners/Fill.png";
import Outline from "assets/banners/Outline.png";
import OutlineLight from "assets/banners/OutlineLight.png";
import PlaceholderLogo from "assets/Placeholders/teamPlaceholder.png";
import { Colors, Fonts } from "constants/styles";
import { getNBATeam } from "constants/teams";
import { getCBBTeam } from "constants/teamsCBB";
import { getCFBTeam } from "constants/teamsCFB";
import { getMLBTeam } from "constants/teamsMLB";
import { getNFLTeam } from "constants/teamsNFL";
import { getNHLTeam } from "constants/teamsNHL";
import { getWNBATeam } from "constants/teamsWNBA";
import { Image, StyleSheet, Text, View } from "react-native";

type Props = {
  championships: Championships[] | undefined;
  teamId?: string | number;
  teamName?: string;
  teamLogo?: any;
  league?: string;
};

function isColorDark(hex: string | undefined): boolean {
  if (!hex) return false;

  const cleaned = hex.replace("#", "");

  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);

  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

  return luminance < 140;
}

function getTeamByLeague(league: string, teamId?: string | number) {
  if (!teamId) return undefined;

  switch (league) {
    case "nfl":
      return getNFLTeam(teamId);

    case "cfb":
      return getCFBTeam(teamId);

    case "cbb":
      return getCBBTeam(teamId);
    case "wcbb":
      return getWCBBTeam(teamId);

    case "mlb":
      return getMLBTeam(teamId);

    case "nhl":
      return getNHLTeam(teamId);

    case "wnba":
      return getWNBATeam(teamId);

    default:
      return getNBATeam(teamId);
  }
}

export default function ChampionshipBanner({
  championships,
  teamId,
  teamName,
  teamLogo,
  league = "nba",
}: Props) {
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const team = getTeamByLeague(league, teamId);
  const styles = championshipBannerStyles(isDark);

  if (!team) {
    console.warn(
      `ChampionshipBanner: No team found for id=${teamId}, name=${teamName}, league=${league}`,
    );
  }

  const championshipList = championships ?? [];
  const isNone = championshipList.length === 0;
  const isMany = championshipList.length > 10;

  const bannerList = isNone
    ? [{ season: null, displayValue: null, isCount: false }]
    : isMany
      ? [
          {
            season: null,
            displayValue: championshipList.length,
            isCount: true,
          },
        ]
      : championshipList.map((championship) => ({
          season: championship.season,
          displayValue:
            league === "nfl"
              ? championship.notes || championship.season
              : championship.season,
          isCount: false,
        }));

  return (
    <View style={styles.wrapper}>
      {bannerList.map(({ season, displayValue, isCount }, index) => {
        const yearShort = isNone
          ? "NONE"
          : isCount
            ? `x${displayValue}`
            : league === "nfl"
              ? String(displayValue)
              : typeof displayValue === "number" ||
                  !Number.isNaN(Number(displayValue))
                ? `'${String(displayValue).slice(-2)}`
                : String(displayValue);

        let label = `${league.toUpperCase()} CHAMPIONS`;

        if (league === "cfb" && !isCount && season != null) {
          const numericYear = Number(season);

          if (!Number.isNaN(numericYear)) {
            label = numericYear <= 2013 ? "BCS CHAMPIONS" : "CFP CHAMPIONS";
          }
        }

        if (league === "mlb") {
          label = "WORLD SERIES CHAMPIONS";
        }

        if (league === "nfl") {
          label = "SUPER BOWL CHAMPIONS";
        }

        if (league === "nhl") {
          label = "STANLEY CUP CHAMPIONS";
        }

        if (league === "wnba") {
          label = "WNBA CHAMPIONS";
        }

        return (
          <View
            key={`${season ?? displayValue ?? "none"}-${index}`}
            style={styles.bannerWrapper}
          >
            <Image
              source={Fill}
              style={[
                styles.bannerFill,
                { tintColor: team?.color ?? Colors.midTone },
              ]}
              resizeMode="contain"
            />

            <Image
              source={isColorDark(team?.color ?? "") ? OutlineLight : Outline}
              style={styles.bannerOutline}
              resizeMode="contain"
            />

            <View style={styles.contentOverlay}>
              <Text style={styles.leagueLabel}>{label}</Text>
              <Text style={styles.yearText}>{yearShort}</Text>

              <Image
                source={teamLogo || PlaceholderLogo}
                style={styles.teamLogo}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const championshipBannerStyles = (isDark: boolean) =>
  StyleSheet.create({
    wrapper: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 12,
      marginVertical: 16,
    },

    bannerWrapper: {
      alignItems: "center",
      justifyContent: "center",
      width: 120,
      height: 165,
    },

    bannerFill: {
      position: "absolute",
      width: "100%",
      height: "100%",
    },

    bannerOutline: {
      position: "absolute",
      width: "100%",
      height: "100%",
    },

    contentOverlay: {
      position: "absolute",
      top: 16,
      alignItems: "center",
      width: "100%",
    },

    yearText: {
      marginTop: 4,
      fontFamily: Fonts.BOLD,
      fontSize: 22,
      color: Colors.white,
    },

    teamLogo: {
      width: 40,
      height: 40,
      marginTop: 8,
      resizeMode: "contain",
    },

    leagueLabel: {
      width: 100,
      fontFamily: Fonts.BOLD,
      fontSize: 12,
      color: Colors.white,
      textAlign: "center",
    },
  });
