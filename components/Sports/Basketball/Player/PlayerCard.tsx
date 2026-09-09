import { activeOpacity } from "@/constants/styles";
import { getWCBBTeam } from "@/constants/teamsWCBB";
import placeholder from "assets/Placeholders/playerPlaceholder.png";
import { getNBATeam } from "constants/teams";
import { getCBBTeam } from "constants/teamsCBB";
import { getCFBTeam } from "constants/teamsCFB";
import { getMLBTeam } from "constants/teamsMLB";
import { getNFLTeam } from "constants/teamsNFL";
import { getNHLTeam } from "constants/teamsNHL";
import { getWNBATeam } from "constants/teamsWNBA";
import { usePreferences } from "contexts/PreferencesContext";
import { useRouter } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { playerCardStyles } from "styles/PlayerStyles/PlayerCardStyles";
import { LeagueType } from "types/types";

export interface PlayerCardProps {
  id: number;
  name: string;
  position?: string | null;
  teamId: number;
  headshot?: string | null;
  rank?: number | null;
  number?: string | number | null;
  league?: string;
  statNumber?: string | number | null;
}

type PlayerRoutePathname =
  | "/player/basketball/[id]"
  | "/player/baseball/[id]"
  | "/player/mma/[id]"
  | "/player/hockey/[id]"
  | "/player/football/[id]"
  | "/player/basketball/[id]"
  | "/player/soccer/[id]";

const LEAGUE_ROUTES: Partial<Record<LeagueType, PlayerRoutePathname>> = {
  nba: "/player/basketball/[id]",
  wnba: "/player/basketball/[id]",
  cbb: "/player/basketball/[id]",
  wcbb: "/player/basketball/[id]",
  mlb: "/player/baseball/[id]",
  cb: "/player/baseball/[id]",
  sb: "/player/baseball/[id]",
  nfl: "/player/football/[id]",
  cfb: "/player/football/[id]",
  ufl: "/player/football/[id]",
  ufc: "/player/mma/[id]",
  nhl: "/player/hockey/[id]",
  leaguescup: "/player/soccer/[id]",
  bundesliga: "/player/soccer/[id]",
  mls: "/player/soccer/[id]",
};

export const PlayerCard: React.FC<PlayerCardProps> = ({
  id,
  name,
  rank,
  teamId,
  headshot,
  number,
  statNumber,
  league = "nba",
}) => {
  const router = useRouter();
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = playerCardStyles(isDark);

  const isNBA = league === "nba";
  const isWNBA = league === "wnba";
  const isMLB = league === "mlb";
  const isNFL = league === "nfl";
  const isCFB = league === "cfb";
  const isCBB = league === "cbb";
  const isWCBB = league === "wcbb";
  const isNHL = league === "nhl";

  const team = isNBA
    ? getNBATeam(teamId)
    : isMLB
      ? getMLBTeam(teamId)
      : isNFL
        ? getNFLTeam(teamId)
        : isNHL
          ? getNHLTeam(teamId)
          : isCFB
            ? getCFBTeam(teamId)
            : isWNBA
              ? getWNBATeam(teamId)
              : isCBB
                ? getCBBTeam(teamId)
                : isWCBB
                  ? getWCBBTeam(teamId)
                  : null;

  const teamName = team?.name;

  const displayValue =
    statNumber != null && statNumber !== ""
      ? Number(statNumber).toLocaleString()
      : number != null && number !== ""
        ? `#${number}`
        : null;

  const typedLeague = league as LeagueType;
  const route = LEAGUE_ROUTES[typedLeague];

  const handlePress = () => {
    if (!route) {
      console.warn(`[PlayerCard] No player route configured for ${league}`);
      return;
    }

    if (!teamId) {
      console.warn(`[PlayerCard] No team found for "${teamName}" in ${league}`);
      return;
    }

    router.push({
      pathname: route,
      params: {
        id: String(id),
        teamId: String(teamId),
        league: typedLeague,
      },
    });
  };

  return (
    <TouchableOpacity
      activeOpacity={activeOpacity}
      style={styles.card}
      onPress={handlePress}
    >
      <View style={styles.container}>
        {rank ? <Text style={styles.rank}>{rank}</Text> : null}

        <View style={styles.avatarContainer}>
          {headshot ? (
            <Image source={{ uri: headshot }} style={styles.avatar} />
          ) : (
            <Image source={placeholder} style={styles.avatar} />
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.name}>{name}</Text>

          {displayValue ? (
            <Text style={styles.jerseyNumber}>{displayValue}</Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default PlayerCard;
