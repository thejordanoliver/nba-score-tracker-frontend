import { BaseballGameCardProps } from "@/types/baseball/baseball";
import {
  formatDate,
  formatTime,
  getHolidayLabel,
  safeDate,
} from "@/utils/dateUtils";
import { Ionicons } from "@expo/vector-icons";
import { Colors, activeOpacity } from "constants/styles";
import { getCBTeam, getCBTeamLogo } from "constants/teamsCB";
import { getMLBTeam, getMLBTeamLogo } from "constants/teamsMLB";
import { getSBTeam, getSBTeamLogo } from "constants/teamsSB";
import { usePreferences } from "contexts/PreferencesContext";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { memo } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { gameCardStyles } from "styles/GamecardStyles/GameCardStyles";
import { getBroadcastDisplay, winnerStyle } from "utils/games";
import { BasesIndicator } from "../GameDetails/BasesIndicator";

function BaseballGameCard({ game, isCB, isSB }: BaseballGameCardProps) {
  const router = useRouter();
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const handlePress = () => {
    router.push({
      pathname: "/game/baseball/[game]",
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

  const home = game?.home;
  const away = game?.away;
  const homeId = home?.id;
  const awayId = away?.id;

  const homeTeam = isSB
    ? getSBTeam(homeId)
    : isCB
      ? getCBTeam(homeId)
      : getMLBTeam(homeId);
  const awayTeam = isSB
    ? getSBTeam(awayId)
    : isCB
      ? getCBTeam(awayId)
      : getMLBTeam(awayId);

  const homeName = homeTeam?.shortName ?? homeTeam?.name;
  const awayName = awayTeam?.shortName ?? awayTeam?.name;

  const homeLogo = isSB
    ? getSBTeamLogo(homeId, isDark)
    : isCB
      ? getCBTeamLogo(homeId, isDark)
      : getMLBTeamLogo(homeId, isDark);

  const awayLogo = isSB
    ? getSBTeamLogo(awayId, isDark)
    : isCB
      ? getCBTeamLogo(awayId, isDark)
      : getMLBTeamLogo(awayId, isDark);

  const league = game?.league?.code ?? "mlb";

  const isChampionship = game?.season.slug === "championship-series";
  const styles = gameCardStyles(isDark, isChampionship);
  const broadcasts = game?.broadcasts;
  const broadcast = getBroadcastDisplay(broadcasts);
  const gameStatusDescription = game.status.description ?? "";
  const gameStatusDetail = game.status.shortDetail ?? "";
  const tbd = gameStatusDetail.includes("TBD") ? "TBD" : null;
  const isScheduled = gameStatusDescription === "Scheduled";
  const inProgress = gameStatusDescription === "In Progress";
  const isFinal = gameStatusDescription === "Final";
  const isCanceled = gameStatusDescription === "Canceled";
  const isPostponed = gameStatusDescription === "Postponed";
  const isSuspended = gameStatusDescription === "Suspended";
  const isForfeited = gameStatusDescription === "Forfeited";
  const isDelayed =
    gameStatusDescription === "Delayed" ||
    gameStatusDescription === "Rain Delay";
  const isEndOfInning = gameStatusDetail.includes("End");
  const homeScore = home?.score ?? 0;
  const awayScore = away?.score ?? 0;
  const homeRecord = home?.record;
  const awayRecord = away?.record;
  const homeRank = home?.homeRank;
  const awayRank = away?.awayRank;
  const isTopInning = gameStatusDetail.includes("Top");
  const isBottomInning = gameStatusDetail.includes("Bot");
  const headline = game.headline ?? holidayLabel;
  const outs = game?.situation.outs;
  const countOuts = Math.min(Math.max(outs ?? 0, 0), 3);
  const getOuts = [1, 2, 3].map((i) => (
    <Ionicons
      key={i}
      size={8}
      name={i <= countOuts ? "ellipse" : "ellipse-outline"}
      color={isDark ? Colors.dark.lightRed : Colors.light.red}
    />
  ));
  const bases = {
    onFirst: game?.situation?.onFirst,
    onSecond: game?.situation?.onSecond,
    onThird: game?.situation?.onThird,
  };

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
    score: number | undefined;
    record: string | undefined;
    isWinner: boolean;
  }) => {
    const showRecord = isScheduled || isCanceled || isPostponed;

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
    return (
      <View>
        {/* ⚾ Scheduled */}
        {isScheduled && (
          <View style={styles.infoWrapper}>
            <Text style={styles.date}>{formattedDate}</Text>
            <View style={styles.statusDivider} />
            <Text style={styles.date}>{tbd || formattedTime}</Text>
          </View>
        )}

        {/* 🕒 In Progress */}
        {inProgress && !isDelayed && !isEndOfInning && (
          <View>
            <View style={styles.infoWrapper}>
              {isTopInning && (
                <Ionicons
                  name={"caret-up"}
                  size={10}
                  color={isDark ? Colors.white : Colors.black}
                />
              )}
              {isBottomInning && (
                <Ionicons
                  name={"caret-down"}
                  size={10}
                  color={isDark ? Colors.white : Colors.black}
                />
              )}
              <Text style={styles.date}>{gameStatusDetail}</Text>

              <View style={styles.statusDivider} />
              <View style={styles.outsContainer}>{getOuts}</View>
            </View>
            <View style={styles.basesContainer}>
              <BasesIndicator size={8} bases={bases} isDark={isDark} />
            </View>
          </View>
        )}

        {/* 🕒 In Progress */}
        {isEndOfInning && (
          <View>
            <View style={styles.infoWrapper}>
              <Text style={styles.finalText}>{gameStatusDetail}</Text>
            </View>
          </View>
        )}

        {/* 🏁 Final */}
        {isFinal && (
          <View style={styles.infoWrapper}>
            <Text style={styles.finalText}>{gameStatusDetail}</Text>
            <View style={styles.finalStatusDivider} />
            <Text style={styles.finalText}>{formattedDate}</Text>
          </View>
        )}

        {/* ❌ Canceled */}
        {isCanceled && (
          <View style={styles.infoWrapper}>
            <Text style={styles.finalText}>Canceled</Text>
          </View>
        )}

        {/* ❌ Forfeited */}
        {isForfeited && (
          <View style={styles.infoWrapper}>
            <Text style={styles.finalText}>Forfeited</Text>
          </View>
        )}

        {/* ⏸️ Suspended */}
        {isSuspended && (
          <View style={styles.infoWrapper}>
            <Text style={styles.finalText}>Suspended</Text>
          </View>
        )}

        {/* ⏸️ Postponed */}
        {isPostponed && (
          <View style={styles.infoWrapper}>
            <Text style={styles.finalText}>Postponed</Text>
          </View>
        )}

        {/* ⏸️ Delayed */}
        {isDelayed && (
          <View style={styles.infoWrapper}>
            <Text style={styles.finalText}>Delayed</Text>
          </View>
        )}
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
        <Text style={styles.teamName}>
          {awayRank && <Text style={styles.rank}>{awayRank} </Text>}
          {awayName}
        </Text>
      </View>

      <ScoreText score={awayScore} record={awayRecord} isWinner={awayWins} />

      <View style={styles.headlineContainer}>
        <Text style={[styles.headlineText]}>{headline}</Text>
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
        <Text style={styles.teamName}>
          {homeRank && <Text style={styles.rank}>{homeRank} </Text>}
          {homeName}
        </Text>
      </View>
    </>
  );

  /* ===============================
     RENDER
  =============================== */
  return (
    <TouchableOpacity activeOpacity={activeOpacity} onPress={handlePress}>
      {isChampionship ? (
        <LinearGradient
          colors={
            isDark
              ? ["#846f4a", "#50412a"]
              : (["#dbb145ff", "#CDA765"] as [string, string])
          }
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

export default memo(BaseballGameCard);
