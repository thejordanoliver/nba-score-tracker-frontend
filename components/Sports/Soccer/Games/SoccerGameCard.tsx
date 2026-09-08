import { getSOCCTeam, getSOCCTeamLogo } from "@/constants/teamsSOCC";
import {
  formatDate,
  formatTime,
  getHolidayLabel,
  safeDate,
} from "@/utils/dateUtils";
import { activeOpacity } from "constants/styles";
import { usePreferences } from "contexts/PreferencesContext";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { gameCardStyles } from "styles/GamecardStyles/GameCardStyles";
import { formatPeriod, getBroadcastDisplay, winnerStyle } from "utils/games";
import { SoccerGameCardProps } from "../../../../types/soccer/soccer";

export default function SoccerGameCard({ game }: SoccerGameCardProps) {
  const router = useRouter();
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";

  const league = game?.league?.code;

  const handlePress = () => {
    router.push({
      pathname: "/game/soccer/[game]",
      params: {
        game: String(game.id),
        leagueId: String(league),
        data: encodeURIComponent(JSON.stringify(game)),
      },
    });
  };

  const gameDate = safeDate(game.date);
  const formattedDate = formatDate(gameDate);
  const formattedTime = formatTime(gameDate);
  const holidayLabel = getHolidayLabel(gameDate);

  const home = game.home;
  const away = game.away;
  const homeId = Number(home?.id ?? 0);
  const awayId = Number(away?.id ?? 0);
  const homeTeam = getSOCCTeam(homeId);
  const awayTeam = getSOCCTeam(awayId);
  const homeName = homeTeam?.shortName || homeTeam?.name || home?.name || "TBD";
  const awayName = awayTeam?.shortName || awayTeam?.name || away?.name || "TBD";
  const homeLogo = getSOCCTeamLogo(homeId, isDark);
  const awayLogo = getSOCCTeamLogo(awayId, isDark);
  const homeScore = Number(game?.home?.score ?? 0);
  const awayScore = Number(game?.away?.score ?? 0);
  const homeRecord = game?.home?.record ?? "0-0-0";
  const awayRecord = game?.away?.record ?? "0-0-0";

  const headline = game?.headline || holidayLabel;
  const isChampionship = Boolean(headline?.includes("Final"));
  const styles = gameCardStyles(isDark, isChampionship);

  const broadcast = getBroadcastDisplay(game?.broadcasts);
  const period = formatPeriod({ period: game?.status.period, isSOCC: true });
  const clock = game.status?.displayClock;
  const gameStatusDescription = game.status?.description;
  const gameStatusDetail = game.status?.shortDetail;
  const tbd = gameStatusDetail?.includes("TBD") ? "TBD" : null;
  const inProgress = game.status.state === "in";
  const isFinal = game.status.state === "post";
  const isScheduled = game.status.state === "pre";
  const isSuspended = gameStatusDescription === "Suspended";
  const isCanceled = gameStatusDescription === "Canceled";
  const isDelayed = gameStatusDescription === "Delayed";
  const isPostponed = gameStatusDescription === "Postponed";
  const isForfeited = gameStatusDescription === "Forfeit";
  const isHalftime = gameStatusDescription === "Halftime";
  const endOfPeriod = gameStatusDescription === "End of Period";

  // -----------------------------------------------------
  // SCORE TEXT COMPONENT
  // -----------------------------------------------------
  const homeWins = game.home.winner;
  const awayWins = game.away.winner;
  const isTie = game.home.winner === game.away.winner;

  const ScoreText = ({
    score,
    record,
    isWinner,
  }: {
    score: number;
    record: string | undefined;
    isWinner: boolean;
  }) => {
    const showRecord = isScheduled;

    return (
      <Text
        style={
          showRecord
            ? styles.teamRecord
            : [
                styles.teamScore,
                winnerStyle({
                  isWinner: isWinner,
                  isTie: isTie,
                  isDark: isDark,
                }),
              ]
        }
      >
        {showRecord ? record : score}
      </Text>
    );
  };

  const renderStatus = () => {
    if (inProgress && !endOfPeriod && !isDelayed && !isHalftime) {
      return (
        <View style={styles.infoWrapper}>
          <Text style={styles.period}>{period}</Text>
          <View style={styles.statusDivider} />
          <Text style={styles.clock}>{clock}</Text>
        </View>
      );
    }

    if (isDelayed || isCanceled || isPostponed || isForfeited || isSuspended) {
      return <Text style={styles.finalText}>{gameStatusDescription}</Text>;
    }

    if (isHalftime) {
      return <Text style={styles.finalText}>Halftime</Text>;
    }

    if (endOfPeriod) {
      return <Text style={styles.clock}>End of {period}</Text>;
    }

    if (isFinal) {
      return (
        <View style={styles.infoWrapper}>
          <Text style={styles.finalText}>{gameStatusDetail}</Text>
          <View style={styles.finalStatusDivider} />
          <Text style={styles.finalText}>{formattedDate}</Text>
        </View>
      );
    }

    return (
      <View style={styles.infoWrapper}>
        <Text style={styles.date}>{formattedDate}</Text>
        <View style={styles.statusDivider} />
        <Text style={styles.date}>{tbd || formattedTime}</Text>
      </View>
    );
  };

  const renderCardContent = () => (
    <>
      <View style={styles.teamSection}>
        <Image
          source={awayLogo}
          style={styles.logo}
          accessibilityLabel={`${awayName} logo`}
        />
        <Text
          style={styles.teamName}
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.5}
        >
          {awayName}
        </Text>
      </View>

      <ScoreText score={awayScore} record={awayRecord} isWinner={awayWins} />

      <View style={styles.headlineContainer}>
        <Text style={styles.headlineText}>{headline}</Text>
      </View>

      <View style={styles.info}>
        {renderStatus()}
        {!isFinal && broadcast && (
          <Text style={styles.broadcast}>{broadcast}</Text>
        )}
      </View>

      <ScoreText score={homeScore} record={homeRecord} isWinner={homeWins} />

      <View style={styles.teamSection}>
        <Image
          source={homeLogo}
          style={styles.logo}
          accessibilityLabel={`${homeName} logo`}
        />
        <Text
          style={styles.teamName}
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.5}
        >
          {homeName}
        </Text>
      </View>
    </>
  );

  return (
    <TouchableOpacity activeOpacity={activeOpacity} onPress={handlePress}>
      {isChampionship ? (
        <LinearGradient
          colors={isDark ? ["#846f4a", "#50412a"] : ["#dbb145ff", "#CDA765"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.card}
        >
          {renderCardContent()}
        </LinearGradient>
      ) : (
        <View style={styles.card}>{renderCardContent()}</View>
      )}
    </TouchableOpacity>
  );
}
