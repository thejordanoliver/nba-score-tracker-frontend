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
import { squareGameCardStyles } from "styles/GamecardStyles/SquareGameCardStyles";
import { getBroadcastDisplay } from "utils/games";
import { BasesIndicator } from "../GameDetails/BasesIndicator";

function BaseballSquareGamecard({ game, isSB, isCB }: BaseballGameCardProps) {
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

  const league = game?.league?.code ?? "mlb";

  const home = game?.home;
  const away = game?.away;
  const homeId = home?.id;
  const awayId = away?.id;
  const homeTeam = isSB
    ? getSBTeam(home?.id)
    : isCB
      ? getCBTeam(home?.id)
      : getMLBTeam(home?.id);

  const awayTeam = isSB
    ? getSBTeam(away?.id)
    : isCB
      ? getCBTeam(away?.id)
      : getMLBTeam(away?.id);

  const homeTeamId = homeTeam?.id ?? 0;
  const awayTeamId = awayTeam?.id ?? 0;

  const homeName = homeTeam?.code || game.home?.code;
  const awayName = awayTeam?.code || game.away?.code;

  const homeLogo = isSB
    ? getSBTeamLogo(homeId, isDark)
    : isCB
      ? getCBTeamLogo(homeId, isDark)
      : getMLBTeamLogo(homeTeamId, isDark);

  const awayLogo = isSB
    ? getSBTeamLogo(awayId, isDark)
    : isCB
      ? getCBTeamLogo(awayId, isDark)
      : getMLBTeamLogo(awayTeamId, isDark);

  const isChampionship = game?.season.slug === "championship-series";
  const styles = squareGameCardStyles(isDark, isChampionship);
  const broadcasts = game?.broadcasts;
  const broadcast = getBroadcastDisplay(broadcasts);
  const gameStatusDescription = game.status.description ?? "";
  const gameStatusDetail = game.status.shortDetail ?? "";
  const tbd = gameStatusDetail.includes("TBD") ? "TBD" : null;
  const isEndOfInning = gameStatusDetail.includes("End");
  const isScheduled = gameStatusDescription === "Scheduled";
  const inProgress = gameStatusDescription === "In Progress";
  const isFinal = gameStatusDescription === "Final";
  const isCanceled = gameStatusDescription === "Canceled";
  const isDelayed =
    gameStatusDescription === "Delayed" ||
    gameStatusDescription === "Rain Delay";
  const isPostponed = gameStatusDescription === "Postponed";
  const isSuspended = gameStatusDescription === "Suspended";
  const isForfeited = gameStatusDescription === "Forfeited";
  const homeScore = home?.score ?? 0;
  const awayScore = away?.score ?? 0;
  const homeRecord = game.home.record;
  const awayRecord = game.away.record;
  const homeRank = game.home.homeRank;
  const awayRank = game.away.awayRank;
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
    teamWins,
  }: {
    score: number | undefined;
    record: string | undefined;
    teamWins: boolean;
  }) => {
    const showRecord = isScheduled || isCanceled || isPostponed;

    return (
      <Text
        style={
          showRecord
            ? styles.teamRecord
            : [styles.teamScore, winnerStyle(teamWins)]
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
          <>
            <Text style={styles.date}>{formattedDate}</Text>
            <Text style={styles.date}>{tbd || formattedTime}</Text>
          </>
        )}

        {/* 🕒 In Progress */}
        {inProgress && !isDelayed && !isEndOfInning && (
          <>
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
            </View>
            <View style={styles.basesContainer}>
              <BasesIndicator size={8} bases={bases} isDark={isDark} />
            </View>
            <View style={styles.infoWrapper}>{getOuts}</View>
          </>
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
          <>
            <Text style={styles.finalText}>{gameStatusDetail}</Text>
            <Text style={styles.finalText}>{formattedDate}</Text>
          </>
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
      <Text style={[styles.headlineText]}>{headline}</Text>
      <View style={styles.cardWrapper}>
        {/* Away Team */}
        <View style={styles.teamSection}>
          <View style={styles.teamWrapper}>
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
          <ScoreText
            score={awayScore}
            record={awayRecord}
            isWinner={awayWins}
          />
        </View>

        {/* Home Team */}
        <View style={styles.teamSection}>
          <View style={styles.teamWrapper}>
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
          <ScoreText
            score={homeScore}
            record={homeRecord}
            isWinner={homeWins}
          />
        </View>
      </View>

      {/* Game Info */}
      <View style={styles.info}>
        {renderStatus()}
        {!isFinal && broadcast && (
          <Text style={styles.broadcast}>{broadcast}</Text>
        )}
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

export default memo(BaseballSquareGamecard);
