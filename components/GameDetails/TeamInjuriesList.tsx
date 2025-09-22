import { Fonts } from "constants/fonts";
import players from "constants/players"; // fallback headshot map
import useDbPlayersByTeam, { Player } from "hooks/useDbPlayersByTeam";
import { TeamInjury } from "hooks/useGameDetails";
import { Image, StyleSheet, Text, View, useColorScheme } from "react-native";

type Props = {
  injuries: TeamInjury[];
  lighter: boolean
};

const DEFAULT_HEADSHOT = "https://via.placeholder.com/36?text=👤";

// Map feed team IDs to your database team IDs
const TEAM_ID_MAP: Record<string, string> = {
  "1": "1",
  "2": "2",
  "17": "4",
  "30": "5",
  "4": "6",
  "5": "7",
  "6": "8",
  "7": "9",
  "8": "10",
  "9": "11",
  "10": "14",
  "11": "15",
  "12": "16",
  "13": "17",
  "29": "19",
  "14": "20",
  "15": "21",
  "16": "22",
  "3": "23",
  "18": "24",
  "25": "25",
  "19": "26",
  "20": "27",
  "21": "28",
  "22": "29",
  "23": "30",
  "24": "31",
  "28": "38",
  "26": "40",
  "27": "41",
};

export default function GameInjuries({ injuries, lighter }: Props) {
  const isDark = useColorScheme() === "dark";

  if (!injuries?.length) {
    console.log("No injuries to display.");
    return null;
  }

  // Extract unique DB team IDs
  const teamIds = injuries.map((t) => {
    const feedId = t.team.id.toString();
    const dbId = TEAM_ID_MAP[feedId] || feedId; // fallback if no mapping
    console.log(`Mapping feed team ID ${feedId} → DB team ID ${dbId}`);
    return dbId;
  });

  // Fetch players for each team using the hook at top level
  const teamPlayersMap: Record<string, Player[]> = {};
  teamIds.forEach((teamId) => {
    const { players } = useDbPlayersByTeam(teamId);
    console.log(
      `📦 Fetched ${players.length} DB players for team ID ${teamId}:`,
      players.map((p) => p.full_name)
    );
    teamPlayersMap[teamId] = players;
  });

  const getStyles = styles(isDark);
  const textColor = lighter ? "#fff" : isDark ? "#fff" : "#1d1d1d";
  const subTextColor = lighter ? "#ccc" : isDark ? "#888" : "#555";
  const borderColor = lighter ? "#aaa" : isDark ? "#888" : "#888";
  const status = lighter ? "#ff4444" : isDark ? "#ff4444" : "#cc0000";
  const headshotBackgroundColor = lighter ? "#444" : isDark ? "#444" : "#ddd";
  return (
    <View style={getStyles.container}>
      {injuries.map((team) => {
        const feedTeamId = team.team.id.toString();
        const dbTeamId = TEAM_ID_MAP[feedTeamId] || feedTeamId;
        const teamPlayers = teamPlayersMap[dbTeamId] || [];
        console.log(
          `🏀 Team ${team.team.displayName} (Feed ID: ${feedTeamId}, DB ID: ${dbTeamId}) has ${teamPlayers.length} DB players`
        );

        return (
          <View key={team.team.id} style={getStyles.teamBlock}>
            {team.injuries.map((inj, idx) => {
              const fullName = inj.athlete.fullName;
              console.log(
                `🩺 Processing injury for player: ${fullName} (Team DB ID: ${dbTeamId})`
              );

              // Match player by full_name from DB
              const dbPlayer = teamPlayers.find((p) => {
                if (!p.full_name) return false;
                const dbName = p.full_name.toLowerCase().trim();
                const injName = fullName.toLowerCase().trim();
                const matched =
                  dbName.includes(injName) || injName.includes(dbName);
                if (matched)
                  console.log(
                    `✅ Name match found: DB "${p.full_name}" ↔ Injury "${fullName}"`
                  );
                return matched;
              });

              if (!dbPlayer) {
                console.log(`❌ No DB match found for ${fullName}`);
              }

              // Fallback to headshot map using full name
              const avatarUrl =
                dbPlayer?.avatarUrl || players[fullName] || DEFAULT_HEADSHOT;
              console.log(`🖼 Avatar URL for ${fullName}: ${avatarUrl}`);

              return (
                <View
                  key={idx}
                  style={[
                    getStyles.injuryItem,
                    {
                      borderBottomWidth:
                        idx === team.injuries.length - 1 ? 0 : 1,
                        borderBottomColor: borderColor
                    },
                  ]}
                >
                  <Image
                    source={{ uri: avatarUrl }}
                    style={[getStyles.headshot,{backgroundColor: headshotBackgroundColor}]}
                  />
                  <View style={getStyles.injuryText}>
                    <View style={getStyles.playerHeader}>
                      <Text style={[getStyles.player, {color: textColor}]}>{fullName}</Text>
                      <Text style={[getStyles.jerseyNumber, {color: subTextColor}]}>
                        {dbPlayer?.jersey_number
                          ? `#${dbPlayer.jersey_number}`
                          : "N/A"}
                      </Text>
                    </View>
                    {inj.details?.detail && (
                      <Text style={[getStyles.details,  {color: status}]}>
                        {inj.details.detail}
                      </Text>
                    )}
                  </View>
                  <View>
                    <Text style={[getStyles.status, {color: subTextColor}]}>{inj.status}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

const styles = (isDark: boolean) =>
  StyleSheet.create({
    container: {},
    teamBlock: { marginBottom: 12 },
    injuryItem: {
      flexDirection: "row",
      padding: 8,
      alignItems: "center",
    
    },
    headshot: {
      width: 50,
      height: 50,
      borderRadius: 100,
      paddingTop: 4,
      marginRight: 8,
   
    },
    injuryText: { flex: 1 },
    player: {
      fontFamily: Fonts.OSMEDIUM,
      fontSize: 14,
      color: isDark ? "#fff" : "#1d1d1d",
    },
    playerHeader: {
      flexDirection: "row",
      alignItems: "flex-end",
    },
    status: {
      fontFamily: Fonts.OSREGULAR,
      fontSize: 12,
      color: isDark ? "#aaa" : "#888",
    },
    jerseyNumber: {
      fontSize: 12,
      marginLeft: 4,
      fontFamily: Fonts.OSBOLD,
      color: isDark ? "#aaa" : "#888",
    },
    details: {
      fontFamily: Fonts.OSREGULAR,
      fontSize: 12,
      color: isDark ? "#ff4444" : "#cc0000",
    },
  });
