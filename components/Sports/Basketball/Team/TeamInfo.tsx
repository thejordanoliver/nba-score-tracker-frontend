import InfoCard from "@/components/Sports/Basketball/Team/InfoCard";
import { getSOCCTeam } from "@/constants/teamsSOCC";
import { getWCBBTeam } from "@/constants/teamsWCBB";
import { TeamDetails } from "@/hooks/useTeams";
import { Team } from "@/types/football/football";
import { getNBATeam } from "constants/teams";
import { getCBBTeam } from "constants/teamsCBB";
import { getCFBTeam } from "constants/teamsCFB";
import { getMLBTeam } from "constants/teamsMLB";
import { getNFLTeam } from "constants/teamsNFL";
import { getNHLTeam } from "constants/teamsNHL";
import { getWNBATeam } from "constants/teamsWNBA";
import { StyleSheet, View } from "react-native";

type Props = {
  teamId?: string | number;
  teamDetails: TeamDetails | null;
  league: string;
};

export default function TeamInfo({ teamId, teamDetails, league }: Props) {
  if (!teamId) return null;

  const team = (() => {
    switch (league) {
      case "nba":
        return getNBATeam(teamId);
      case "cfb":
        return getCFBTeam(teamId);
      case "cbb":
        return getCBBTeam(teamId);
      case "wcbb":
        return getWCBBTeam(teamId);
      case "nfl":
        return getNFLTeam(teamId);
      case "mlb":
        return getMLBTeam(teamId);
      case "nhl":
        return getNHLTeam(teamId);
      case "wnba":
        return getWNBATeam(teamId);
      case "soccer":
        return getSOCCTeam(teamId);
      default:
        return null;
    }
  })();

  if (!team) return null;

  const t = team as Team;
  const coachName = `${teamDetails?.coach?.firstName ?? ""} ${
    teamDetails?.coach?.lastName ?? ""
  }`.trim();

  const showConference = ["cfb", "cbb", "wcbb"].includes(league);

  return (
    <View style={styles.infoCardContainer}>
      <InfoCard
        label={league === "mlb" ? "Manager" : "Coach"}
        value={coachName}
        image={teamDetails?.coach?.image}
        team={t}
      />

      <InfoCard label="Location" value={teamDetails?.location} team={t} />

      <InfoCard label="Established" value={teamDetails?.established} team={t} />

      <InfoCard label="Venue" value={teamDetails?.venue?.name} team={t} />

      {showConference && (
        <InfoCard
          label="Conference"
          value={teamDetails?.conference?.shortName}
          team={t}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  infoCardContainer: {
    width: "100%",
  },
});
