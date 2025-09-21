// components/game-preview/GameHeaderSection.tsx

import React from "react";
import { View } from "react-native";
import TeamInfo from "./TeamInfo";
import CenterInfo from "./CenterInfo";
import { Game } from "types/types";
import { teams } from "constants/teams";

type Props = {
  game: Game;
  away: (typeof teams)[number] | undefined;
  home: (typeof teams)[number] | undefined;
  awayWins: boolean;
  homeWins: boolean;
  awayRecord: string;
  homeRecord: string;
  isNBAFinals: boolean;
  isFinal: boolean;
  isCanceled: boolean;
  isPlayoffs: boolean;
  showLiveInfo: boolean;
  broadcastNetworks?: string;
  gameNumberLabel?: string;
  seriesSummary?: string;
  formattedDate: string;
  isDark: boolean;
};

export default function GameHeaderSection({
  game,
  away,
  home,
  awayWins,
  homeWins,
  awayRecord,
  homeRecord,
  isNBAFinals,
  isFinal,
  isCanceled,
  isPlayoffs,
  showLiveInfo,
  broadcastNetworks,
  gameNumberLabel,
  seriesSummary,
  formattedDate,
  isDark,
}: Props) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
      }}
    >
<TeamInfo
  team={away}
  teamName={game.away.name}
  scoreOrRecord={
    game.status === "Scheduled" ? awayRecord : game.awayScore ?? "-"
  }
  isWinner={awayWins}
  isDark={isDark}
  isGameOver={game.status === "Final"} // ✅ added
/>

<CenterInfo
  isNBAFinals={isNBAFinals}
  isFinal={isFinal}
  isCanceled={isCanceled}
  isPlayoffs={isPlayoffs}
  broadcastNetworks={broadcastNetworks}
  showLiveInfo={showLiveInfo}
  period={game.period ?? ""}
  clock={game.clock}
  formattedDate={formattedDate}
  gameNumberLabel={gameNumberLabel}
  seriesSummary={seriesSummary}
  isDark={isDark}
time={game.date ?? ""} // instead of game.startTime
/>

<TeamInfo
  team={home}
  teamName={game.home.name}
  scoreOrRecord={
    game.status === "Scheduled" ? homeRecord : game.homeScore ?? "-"
  }
  isWinner={homeWins}
  isDark={isDark}
  isGameOver={game.status === "Final"} // ✅ added
/>

    </View>
  );
}
