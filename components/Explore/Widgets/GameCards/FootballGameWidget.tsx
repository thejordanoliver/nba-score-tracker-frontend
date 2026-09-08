import { getUFLTeam, getUFLTeamLogo } from "@/constants/teamsUFL";
import { FootballGame } from "@/types/football/football";
import Football from "assets/icons8/Football.png";
import FootballLight from "assets/icons8/FootballLight.png";
import { activeOpacity, Colors } from "constants/styles";
import { getCFBTeam, getCFBTeamLogo } from "constants/teamsCFB";
import { getNFLTeam, getNFLTeamLogo } from "constants/teamsNFL";
import { router } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";
import {
  gameWidgetStyles,
  isSmallGameWidgetLayout,
} from "styles/ExploreStyles/GameWidgetStyles";
import {
  formatDate,
  formatTime,
  getHolidayLabel,
  safeDate,
} from "utils/dateUtils";
import { formatPeriod, getBroadcastDisplay } from "utils/games";
import displayeValue from "utils/widgetUtils";

export type FootballGameWidgetProps = {
  game: FootballGame;
  isCFB: boolean;
  isNFL: boolean;
  isDark: boolean;
  height?: number;
  width?: number;
  loading?: boolean;
};

export default function FootballGameWidget({
  game,
  isNFL,
  isCFB,
  height = 150,
  width = 150,
  loading = false,
  isDark,
}: FootballGameWidgetProps) {
  const league = isNFL ? "nfl" : isCFB ? "cfb" : "ufl";
  const handlePress = () => {
    router.push({
      pathname: "/game/football/[game]",
      params: {
        game: String(game.id),
        leagueId: String(league),
        data: encodeURIComponent(JSON.stringify(game)),
      },
    });
  };
  const styles = gameWidgetStyles(isDark, height, width);
  const isSmallLayout = isSmallGameWidgetLayout(height, width);
  const showHeadline = !isSmallLayout || height >= 170;

  const gameDate = safeDate(game.date);
  const formattedDate = formatDate(gameDate);
  const formattedTime = formatTime(gameDate);
  const holidayLabel = getHolidayLabel(gameDate);

  const home = game.home;
  const away = game.away;

  const homeId = home.id;
  const awayId = away.id;

  const homeTeam = isNFL
    ? getNFLTeam(homeId)
    : isCFB
      ? getCFBTeam(homeId)
      : getUFLTeam(homeId);
  const awayTeam = isNFL
    ? getNFLTeam(awayId)
    : isCFB
      ? getCFBTeam(awayId)
      : getUFLTeam(awayId);

  const awayLogo = isNFL
    ? getNFLTeamLogo(awayId, isDark)
    : isCFB
      ? getCFBTeamLogo(awayId, isDark)
      : getUFLTeamLogo(awayId, isDark);

  const homeLogo = isNFL
    ? getNFLTeamLogo(homeId, isDark)
    : isCFB
      ? getCFBTeamLogo(homeId, isDark)
      : getUFLTeamLogo(homeId, isDark);

  const awayName = awayTeam?.code;
  const homeName = homeTeam?.code;

  const state = game.status.state ?? "";
  const gameStatusDescription = game.status.description ?? "";
  const gameStatusDetail = game.status.shortDetail ?? "";
  const isScheduled = state === "pre";
  const isFinal = state === "post";
  const inProgress = gameStatusDescription === "In Progress";
  const isHalftime = gameStatusDescription === "Halftime";
  const isCanceled = gameStatusDescription === "Canceled";
  const isDelayed = gameStatusDescription === "Delayed";
  const isPostponed = gameStatusDescription === "Postponed";
  const isForfeited = gameStatusDescription === "Forfeited";
  const endOfPeriod = gameStatusDescription === "End of Period";
  const clock = game.status?.clock;
  const period = formatPeriod({ period: game.status.period });
  const redzone = game?.situation.isRedZone;
  const isRedzone = redzone;
  const broadcasts = game?.broadcasts;
  const broadcast = getBroadcastDisplay(broadcasts);
  const downDistanceText = game.situation.downDistanceText;

  const headline = game.headline ?? holidayLabel;
  const possessionTeamId = game.situation.possession;
  const homeRecord = game.home.record;
  const awayRecord = game.away.record;
  const homeScore = game.home.score ?? 0;
  const awayScore = game.away.score ?? 0;
  const homeRank = game.home.rank ?? null;
  const awayRank = game.away.rank ?? null;
  const football = isDark ? FootballLight : Football;

  const homeHasPossession = inProgress && possessionTeamId === home?.espnId;
  const awayHasPossession = inProgress && possessionTeamId === away?.espnId;

  const homeIsWinner = isFinal && homeScore > awayScore;
  const awayIsWinner = isFinal && awayScore > homeScore;
  const showBroadcast = Boolean(broadcast) && (!isSmallLayout || height >= 180);

  // -------------------------
  // Display components for scores
  // -------------------------
  const homeDisplay = displayeValue(
    true,
    isScheduled,
    isFinal,
    homeIsWinner,
    homeRecord,
    homeScore,
    isDark,
    height,
    width,
  );
  const awayDisplay = displayeValue(
    false,
    isScheduled,
    isFinal,
    awayIsWinner,
    awayRecord,
    awayScore,
    isDark,
    height,
    width,
  );

  const awayTeamContent = (
    <View style={styles.teamWrapper}>
      <Image style={styles.teamLogo} source={awayLogo} />
      <Text style={styles.teamName} numberOfLines={1}>
        {awayRank && <Text style={styles.teamRank}>{awayRank} </Text>}
        {awayName}
      </Text>
    </View>
  );

  const awayScoreContent = (
    <View style={styles.scorePossession}>
      {awayDisplay}
      {awayHasPossession && (
        <Image style={styles.awayPossession} source={football} />
      )}
    </View>
  );

  const homeTeamContent = (
    <View style={styles.teamWrapper}>
      <Image style={styles.teamLogo} source={homeLogo} />
      <Text style={styles.teamName} numberOfLines={1}>
        {homeRank && <Text style={styles.teamRank}>{homeRank} </Text>}
        {homeName}
      </Text>
    </View>
  );

  const homeScoreContent = (
    <View style={styles.scorePossession}>
      {homeDisplay}
      {homeHasPossession && (
        <Image style={styles.homePossession} source={football} />
      )}
    </View>
  );

  const renderStatus = () => {
    if (inProgress)
      return (
        <View style={styles.infoWrapper}>
          <Text style={styles.period}>{period}</Text>
          <View style={styles.divider} />
          <Text style={styles.clock}>{clock}</Text>
        </View>
      );

    if (isDelayed) return <Text style={styles.finalText}>Delayed</Text>;
    if (isHalftime) return <Text style={styles.finalText}>Halftime</Text>;
    if (isCanceled) return <Text style={styles.finalText}>Canceled</Text>;
    if (isPostponed) return <Text style={styles.finalText}>Postponed</Text>;
    if (isForfeited) return <Text style={styles.finalText}>Forfeited</Text>;

    if (endOfPeriod)
      return <Text style={styles.clock}>{gameStatusDetail}</Text>;

    if (isFinal)
      return (
        <View style={styles.infoWrapper}>
          <Text style={styles.finalText}>{gameStatusDetail || "Final"}</Text>
          <View style={styles.finalDivder} />
          <Text style={styles.finalText}>{formattedDate}</Text>
        </View>
      );
    return (
      <View style={styles.infoWrapper}>
        <Text style={styles.dateTime}>{formattedDate}</Text>
        <View style={styles.divider} />
        <Text style={styles.dateTime}>{formattedTime}</Text>
      </View>
    );
  };

  const renderDownAndDistance = () => {
    if (!downDistanceText) return null;
    const [beforeAt, afterAt] = downDistanceText.split(" at ");
    return (
      <Text style={styles.downAndDistance}>
        {beforeAt}
        {afterAt && (
          <>
            {" at "}
            <Text
              style={[
                styles.downAndDistance,
                isRedzone && {
                  color: isDark ? Colors.dark.lightRed : Colors.light.red,
                },
              ]}
            >
              {afterAt}
            </Text>
          </>
        )}
      </Text>
    );
  };

  // -------------------------
  // Render widget
  // -------------------------
  return (
    <TouchableOpacity activeOpacity={activeOpacity} onPress={handlePress}>
      <View style={styles.container}>
        {showHeadline && (
          <View style={styles.headlineContainer}>
            <Text
              style={styles.headline}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.5}
            >
              {headline}
            </Text>
          </View>
        )}
        <View style={styles.wrapper}>
          {/* ---------------------- */}
          {/* Away Team Section */}
          {/* ---------------------- */}
          <View style={styles.awaySection}>
            {awayTeamContent}
            {awayScoreContent}
          </View>

          {/* ---------------------- */}
          {/* Game Info Section */}
          {/* ---------------------- */}

          {!isSmallLayout && (
            <View style={styles.gameInfo}>
              {renderStatus()}
              {renderDownAndDistance()}
              {showBroadcast && (
                <Text style={styles.broadcast} numberOfLines={1}>
                  {broadcast}
                </Text>
              )}
            </View>
          )}

          {/* ---------------------- */}
          {/* Home Team Section */}
          {/* ---------------------- */}
          <View style={styles.homeSection}>
            {isSmallLayout ? (
              <>
                {homeTeamContent}
                {homeScoreContent}
              </>
            ) : (
              <>
                {homeScoreContent}
                {homeTeamContent}
              </>
            )}
          </View>

          {isSmallLayout && (
            <View style={styles.gameInfo}>
              {renderStatus()}
              {renderDownAndDistance()}
              {showBroadcast && (
                <Text style={styles.broadcast} numberOfLines={1}>
                  {broadcast}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
