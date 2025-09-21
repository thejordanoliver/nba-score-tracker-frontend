import { useTeamInfo } from "hooks/useTeamInfo";
import { View, useColorScheme } from "react-native";
import InfoCard from "../InfoCard";
import { coachImages } from "constants/teams";

type Props = {
  teamId?: number | string;
};

function calculateWinPercentage(record?: string): string {
  if (!record) return "N/A";
  const [winsStr, lossesStr] = record.split("-");
  const wins = parseInt(winsStr, 10);
  const losses = parseInt(lossesStr, 10);

  if (isNaN(wins) || isNaN(losses) || wins + losses === 0) return "N/A";

  const winPct = (wins / (wins + losses)) * 100;
  return `${winPct.toFixed(1)}%`;
}

export default function TeamInfoCard({ teamId }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { team, loading, error } = useTeamInfo(
    teamId !== undefined ? String(teamId) : undefined
  );

  if (loading) {
    return null; // or loading spinner
  }

  if (error) {
    console.warn(
      `TeamInfoCard: Error fetching team data for id=${teamId}`,
      error
    );
    return null;
  }

  if (!team) {
    console.warn(`TeamInfoCard: No team found for id=${teamId}`);
    return null;
  }

  const winPct = calculateWinPercentage(team.all_time_record);

  const primaryColor = team.primary_color ?? (isDark ? "#111" : "#eee");
  const secondaryColor = team.secondary_color ?? (isDark ? "#444" : "#ccc");

  return (
    <View style={{ width: "100%" }}>
      {/* Coach Info Card */}
      <InfoCard
        label="Head Coach"
        value={team.coach ?? "N/A"}
        image={team.coach_image ? coachImages[team.coach_image] : undefined} // Make sure coachImages is imported
        isDark={isDark}
        team={team}
        backgroundColor={primaryColor}
      />

      {/* Other team info cards */}
      <InfoCard
        label="Location"
        value={`${team.city}, ${team.state}`}
        isDark={isDark}
        team={team}
        backgroundColor={primaryColor}
      />
      <InfoCard
        label="Arena"
        value={team.arena_name ?? "N/A"}
        isDark={isDark}
        team={team}
        backgroundColor={primaryColor}
      />
      <InfoCard
        label="All-Time Record"
        value={team.all_time_record ?? "N/A"}
        isDark={isDark}
        team={team}
        backgroundColor={primaryColor}
      />
      <InfoCard
        label="Win Percentage"
        value={winPct}
        isDark={isDark}
        team={team}
        backgroundColor={primaryColor}
      />
      <InfoCard
        label="First Season"
        value={team.first_season ?? "N/A"}
        isDark={isDark}
        team={team}
        backgroundColor={primaryColor}
      />
      <InfoCard
        label="Conference Championships"
        value={
          Array.isArray(team.conference_championships)
            ? team.conference_championships.join(", ")
            : "0"
        }
        isDark={isDark}
        team={team}
        backgroundColor={primaryColor}
      />
      <InfoCard
        label="Conference"
        value={team.conference ? `${team.conference} Conference` : "N/A"}
        isDark={isDark}
        team={team}
        backgroundColor={primaryColor}
      />
    </View>
  );
}
