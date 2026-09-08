import { HockeyGame } from "@/types/hockey/hockey";
import { getNHLTeamLogo } from "constants/teamsNHL";
import { Image, Text, View } from "react-native";
import {
  gameWidgetStyles,
  isSmallGameWidgetLayout,
} from "styles/ExploreStyles/GameWidgetStyles";
import { getHolidayLabel } from "utils/dateUtils";
import { formatPeriod, getBroadcastDisplay } from "utils/games";
import displayeValue from "utils/widgetUtils";

type GameWidgetProps = {
  game: HockeyGame;
  height?: number;
  width?: number;
  isDark: boolean;
  loading?: boolean;
};

export default function HockeyGameWidget({
  game,
  height = 150,
  width = 150,
  loading = false,
  isDark,
}: GameWidgetProps) {
  const styles = gameWidgetStyles(isDark, height, width);
  const isSmallLayout = isSmallGameWidgetLayout(height, width);
  const showHeadline = !isSmallLayout || height >= 170;

  const home = game.home;
  const away = game.away;

  const homeId = Number(home?.id);
  const awayId = Number(away?.id);

  const homeName = home?.code;
  const awayName = away?.code;

  const homeLogo = getNHLTeamLogo(homeId, isDark);
  const awayLogo = getNHLTeamLogo(awayId, isDark);

  const safeDate = (date?: string | null) => {
    if (!date) return new Date();
    const d = new Date(date);
    return isNaN(d.getTime()) ? new Date() : d;
  };
  const gameDate = safeDate(game?.date);
  const holidayLabel = getHolidayLabel(gameDate);

  const period = formatPeriod({ period: game.status.period, isNHL: true });
  const displayClock = game?.status.clock;
  const homeScore = game?.home.score;
  const awayScore = game?.away.score;

  const state = game.status.state ?? "";
  const gameStatusDescription = game.status.description ?? "";
  const gameStatusDetail = game.status.shortDetail ?? "";
  const isScheduled = state === "pre";
  const isFinal = state === "post";
  const inProgress = gameStatusDescription === "In Progress";
  const isCanceled = gameStatusDescription === "Canceled";
  const isDelayed = gameStatusDescription === "Delayed";
  const isPostponed = gameStatusDescription === "Postponed";
  const isForfeited = gameStatusDescription === "Forfeit";
  const isHalftime = gameStatusDescription === "Halftime";
  const endOfPeriod = gameStatusDescription === "End of Period";
  const headlineText = game?.headline;
  const headline = headlineText || holidayLabel;

  const homeRecord = game?.home.record ?? "0-0";
  const awayRecord = game.away.record ?? "0-0";

  const broadcastText = getBroadcastDisplay(game?.broadcasts);
  const showBroadcast =
    Boolean(broadcastText) && (!isSmallLayout || height >= 180);

  const formattedDate = gameDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const formattedTime =
    gameDate?.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }) || "";

  // -----------------------------------------------------
  // SCORE TEXT COMPONENT
  // -----------------------------------------------------
  const homeWins = (homeScore ?? 0) > (awayScore ?? 0);
  const awayWins = (awayScore ?? 0) > (homeScore ?? 0);

  // -------------------------
  // Display components for scores
  // -------------------------
  const homeDisplay = displayeValue(
    true,
    isScheduled,
    isFinal,
    homeWins,
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
    awayWins,
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
        {awayName}
      </Text>
    </View>
  );

  const homeTeamContent = (
    <View style={styles.teamWrapper}>
      <Image style={styles.teamLogo} source={homeLogo} />
      <Text style={styles.teamName} numberOfLines={1}>
        {homeName}
      </Text>
    </View>
  );

  // -------------------------
  // Render widget
  // -------------------------
  return (
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
          {awayDisplay}
        </View>

        {/* ---------------------- */}
        {/* Game Info Section */}
        {/* ---------------------- */}
        {!isSmallLayout && (
          <View style={styles.gameInfo}>
            {isScheduled && (
              <View style={styles.infoWrapper}>
                <Text style={styles.dateTime} numberOfLines={1}>
                  {formattedDate}
                </Text>
                <View style={styles.divider} />
                <Text style={styles.dateTime} numberOfLines={1}>
                  {formattedTime}
                </Text>
              </View>
            )}

            {isFinal && (
              <Text style={styles.finalText} numberOfLines={1}>
                {gameStatusDetail}
              </Text>
            )}

            {isPostponed && (
              <Text style={styles.finalText} numberOfLines={1}>
                {gameStatusDescription}
              </Text>
            )}
            {isCanceled && (
              <Text style={styles.finalText} numberOfLines={1}>
                {gameStatusDescription}
              </Text>
            )}
            {isDelayed && (
              <Text style={styles.finalText} numberOfLines={1}>
                {gameStatusDescription}
              </Text>
            )}
            {isForfeited && (
              <Text style={styles.finalText} numberOfLines={1}>
                {gameStatusDescription}
              </Text>
            )}

            {inProgress && !isHalftime && endOfPeriod && (
              <Text style={styles.finalText} numberOfLines={1}>
                End of {period}
              </Text>
            )}

            {inProgress && !isHalftime && !endOfPeriod && (
              <View style={styles.infoWrapper}>
                <Text style={styles.period} numberOfLines={1}>
                  {period}
                </Text>
                <View style={styles.divider} />
                {displayClock && (
                  <Text style={styles.clock} numberOfLines={1}>
                    {displayClock}
                  </Text>
                )}
              </View>
            )}

            {isHalftime && (
              <Text style={styles.finalText} numberOfLines={1}>
                Halftime
              </Text>
            )}
            {showBroadcast && (
              <Text style={styles.broadcast} numberOfLines={1}>
                {broadcastText}
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
              {homeDisplay}
            </>
          ) : (
            <>
              {homeDisplay}
              {homeTeamContent}
            </>
          )}
        </View>
        {isSmallLayout && (
          <View style={styles.gameInfo}>
            {isScheduled && (
              <View style={styles.infoWrapper}>
                <Text style={styles.dateTime} numberOfLines={1}>
                  {formattedDate}
                </Text>
                <View style={styles.divider} />
                <Text style={styles.dateTime} numberOfLines={1}>
                  {formattedTime}
                </Text>
              </View>
            )}

            {isFinal && (
              <Text style={styles.finalText} numberOfLines={1}>
                {gameStatusDetail}
              </Text>
            )}

            {isPostponed && (
              <Text style={styles.finalText} numberOfLines={1}>
                {gameStatusDescription}
              </Text>
            )}
            {isCanceled && (
              <Text style={styles.finalText} numberOfLines={1}>
                {gameStatusDescription}
              </Text>
            )}
            {isDelayed && (
              <Text style={styles.finalText} numberOfLines={1}>
                {gameStatusDescription}
              </Text>
            )}
            {isForfeited && (
              <Text style={styles.finalText} numberOfLines={1}>
                {gameStatusDescription}
              </Text>
            )}

            {inProgress && !isHalftime && endOfPeriod && (
              <Text style={styles.finalText} numberOfLines={1}>
                End of {period}
              </Text>
            )}

            {inProgress && !isHalftime && !endOfPeriod && (
              <View style={styles.infoWrapper}>
                <Text style={styles.period} numberOfLines={1}>
                  {period}
                </Text>
                <View style={styles.divider} />
                {displayClock && (
                  <Text style={styles.clock} numberOfLines={1}>
                    {displayClock}
                  </Text>
                )}
              </View>
            )}

            {isHalftime && (
              <Text style={styles.finalText} numberOfLines={1}>
                Halftime
              </Text>
            )}
            {showBroadcast && (
              <Text style={styles.broadcast} numberOfLines={1}>
                {broadcastText}
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
