import { BasesIndicator } from "@/components/Sports/Baseball/GameDetails/BasesIndicator";
import { BaseballGame } from "@/types/baseball/baseball";
import { getBroadcastDisplay } from "@/utils/games";
import displayeValue from "@/utils/widgetUtils";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "constants/styles";
import { getMLBTeam, getMLBTeamLogo } from "constants/teamsMLB";
import { Image, Text, View } from "react-native";
import {
  gameWidgetStyles,
  isSmallGameWidgetLayout,
} from "styles/ExploreStyles/GameWidgetStyles";
import { getHolidayLabel } from "utils/dateUtils";

type BaseballGameWidgetProps = {
  game: BaseballGame;
  height?: number;
  width?: number;
  isDark: boolean;
  loading?: boolean;
};

export default function BaseballGameWidget({
  game,
  height = 150,
  width = 150,
  loading = false,
  isDark,
}: BaseballGameWidgetProps) {
  const styles = gameWidgetStyles(isDark, height, width);
  const isSmallLayout = isSmallGameWidgetLayout(height, width);
  const showHeadline = !isSmallLayout || height >= 170;

  const gameDateObj = new Date(game.date);
  const formattedDate = gameDateObj.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });

  const formattedTime = gameDateObj.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  const home = game.home;
  const away = game.away;

  const homeId = home?.id;
  const awayId = away?.id;

  const homeTeam = getMLBTeam(homeId);
  const awayTeam = getMLBTeam(awayId);

  const homeName = homeTeam?.code;
  const awayName = awayTeam?.code;

  const homeLogo = getMLBTeamLogo(homeId, isDark);
  const awayLogo = getMLBTeamLogo(awayId, isDark);

  const homeRank = home?.homeRank;
  const awayRank = away?.awayRank;

  const homeRecord = home?.record;
  const awayRecord = away?.record;

  const homeScore = home?.score;
  const awayScore = away?.score;

  const broadcasts = game?.broadcasts;
  const broadcast = getBroadcastDisplay(broadcasts);
  const state = game.status.state ?? "";
  const gameStatusDescription = game.status.description ?? "";
  const gameStatusDetail = game.status.shortDetail ?? "";
  const isScheduled = state === "pre";
  const isFinal = state === "post";
  const inProgress = gameStatusDescription === "In Progress";
  const isCanceled = gameStatusDescription === "Canceled";
  const isDelayed = gameStatusDescription === "Delayed";
  const isPostponed = gameStatusDescription === "Postponed";
  const isSuspended = gameStatusDescription === "Suspended";
  const isForfeited = gameStatusDescription === "Forfeited";
  const endOfInning = gameStatusDescription === "End of Inning";
  const isTopInning = gameStatusDetail.includes("Top");
  const holidayLabel = getHolidayLabel(gameDateObj);
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
        <Text
          style={styles.teamName}
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.5}
        >
          {awayRank}{" "}
        </Text>
        {awayName}
      </Text>
    </View>
  );

  const homeTeamContent = (
    <View style={styles.teamWrapper}>
      <Image style={styles.teamLogo} source={homeLogo} />
      <Text style={styles.teamName} numberOfLines={1}>
        <Text
          style={styles.teamName}
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.5}
        >
          {homeRank}{" "}
        </Text>
        {homeName}
      </Text>
    </View>
  );

  const renderStatus = () => {
    if (inProgress)
      return (
        <>
          <View style={styles.infoWrapper}>
            <Ionicons
              name={isTopInning ? "caret-up" : "caret-down"}
              size={14}
              color={isDark ? Colors.white : Colors.black}
            />
            <Text style={styles.period}>{gameStatusDetail}</Text>
            <View style={styles.divider} />
            <View style={styles.outsContainer}>{getOuts}</View>
          </View>
        </>
      );

    if (isDelayed || isCanceled || isPostponed || isForfeited || isSuspended)
      return <Text style={styles.finalText}>{gameStatusDescription}</Text>;

    if (endOfInning)
      return <Text style={styles.clock}>{gameStatusDetail}</Text>;

    if (isFinal)
      return (
        <View style={styles.infoWrapper}>
          <Text style={styles.finalText}>{gameStatusDetail}</Text>
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

      <View style={styles.basesContainer}>
        {inProgress && (
          <BasesIndicator bases={bases} isDark={isDark} size={8} />
        )}
      </View>

      <View style={styles.wrapper}>
        <View style={styles.awaySection}>
          {awayTeamContent}
          {awayDisplay}
        </View>

        {!isSmallLayout && (
          <View style={styles.gameInfo}>
            {renderStatus()}
            <Text style={styles.broadcast}>{broadcast}</Text>
          </View>
        )}

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
            {renderStatus()}
            <Text style={styles.broadcast}>{broadcast}</Text>
          </View>
        )}
      </View>
    </View>
  );
}
