import {
  formatDate,
  formatTime,
  getHolidayLabel,
  safeDate,
} from "@/utils/dateUtils";
import placeholderImage from "assets/Placeholders/playerPlaceholder.png";
import { activeOpacity } from "constants/styles";
import { usePreferences } from "contexts/PreferencesContext";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { stackedGameCardStyles } from "styles/GamecardStyles/StackedGameCardStyles";
import { MMAFightCardProps } from "types/mma/mma";
import { formatPeriod, formatRound, getBroadcastDisplay } from "utils/games";

export default function MMAStackedGameCard({ game }: MMAFightCardProps) {
  const router = useRouter();
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const handlePress = () => {
    router.push({
      pathname: "/game/mma/[game]",
      params: {
        game: String(game.id),
        data: encodeURIComponent(JSON.stringify(game)),
      },
    });
  };

  const gameDate = safeDate(game.date);
  const formattedDate = formatDate(gameDate);
  const formattedTime = formatTime(gameDate);
  const holidayLabel = getHolidayLabel(gameDate);

  const headline = game?.headline ?? holidayLabel;
  const firstFighter = game.competitors?.[0];
  const secondFighter = game.competitors?.[1];
  const firstFighterName = firstFighter?.shortName ?? "TBD";
  const secondFighterName = secondFighter?.shortName ?? "TBD";
  const firstFighterPhoto = firstFighter?.headshot ?? placeholderImage;
  const secondFighterPhoto = secondFighter?.headshot ?? placeholderImage;
  const firstFighterFlag = firstFighter?.flag ?? "";
  const secondFighterFlag = secondFighter?.flag ?? "";
  const firstFighterRecord = firstFighter?.record ?? "0-0";
  const secondFighterRecord = secondFighter?.record ?? "0-0";
  const firstFighterWinner = firstFighter?.winner === true;
  const secondFighterWinner = secondFighter?.winner === true;
  const gameStatusDescription = game?.status?.description;
  const gameStatusDetail = game?.status?.shortDetail ?? "";
  const tbd = gameStatusDetail.includes("TBD") ? "TBD" : null;
  const isScheduled = gameStatusDescription === "Scheduled";
  const isCanceled = gameStatusDescription === "Canceled";
  const isFinal = gameStatusDescription === "Final";
  const isPostponed = gameStatusDescription === "Postponed";
  const isDelayed = gameStatusDescription === "Delayed";
  const isForfeited = gameStatusDescription === "Forfeited";
  const isEndOfRound = gameStatusDescription === "End of Round";
  const inProgress = gameStatusDescription === "In Progress";
  const inWalkouts = gameStatusDescription === "Walkouts";
  const isIntros = gameStatusDescription === "Intros";
  const broadcasts = game.broadcasts;
  const broadcast = getBroadcastDisplay(broadcasts);
  const period = formatPeriod({ period: game?.status?.period, isMMA: true });
  const clock = game?.status?.displayClock;
  const styles = stackedGameCardStyles(isDark);
  const resultText = game.method;
  const results =
    resultText?.toLowerCase() === "submission"
      ? "SUB"
      : resultText?.toLowerCase() === "decision"
        ? "DEC"
        : resultText;

  const ScoreText = ({
    record,
    winner,
  }: {
    record: string | undefined;
    winner: boolean | undefined;
  }) => {
    const showRecord =
      isScheduled ||
      inWalkouts ||
      isCanceled ||
      isPostponed ||
      isDelayed ||
      isForfeited;

    const opacity = isFinal && winner === false ? 0.5 : 1;
    if (showRecord) {
      return <Text style={styles.teamRecord}>{record}</Text>;
    }

    if (winner) {
      return (
        <View style={styles.winnerContainer}>
          <Text style={[styles.teamRecord, { opacity }]}>{record}</Text>
        </View>
      );
    }

    return <Text style={[styles.teamRecord, { opacity }]}>{record}</Text>;
  };

  const renderStatus = () => {
    if (inProgress)
      return (
        <View style={styles.infoWrapper}>
          <Text style={styles.period}>{period}</Text>
          <View style={styles.statusDivider} />
          <Text style={styles.clock}>{clock}</Text>
        </View>
      );

    if (inWalkouts) return <Text style={styles.finalText}>Walkouts</Text>;
    if (isIntros) return <Text style={styles.finalText}>Intros</Text>;
    if (isDelayed) return <Text style={styles.finalText}>Delayed</Text>;
    if (isCanceled) return <Text style={styles.finalText}>Canceled</Text>;
    if (isPostponed) return <Text style={styles.finalText}>Postponed</Text>;
    if (isForfeited) return <Text style={styles.finalText}>Forfeited</Text>;

    if (isEndOfRound)
      return <Text style={styles.clock}>End of {formatRound(period)}</Text>;

    if (isFinal)
      return (
        <View style={styles.infoWrapper}>
          <Text style={styles.finalText}>{results}</Text>
          <View style={styles.finalStatusDivider} />
          <Text style={styles.finalText}>{formattedDate}</Text>
        </View>
      );

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
      <View style={styles.cardWrapper}>
        {/* Second Fighter */}
        <View style={styles.teamSection}>
          <View style={styles.teamWrapper}>
            <View style={styles.fighterContainer}>
              <Image
                source={{ uri: secondFighterPhoto }}
                style={styles.fighter}
                contentFit="contain"
                accessibilityLabel={secondFighterName}
              />
            </View>

            <Text
              style={styles.teamName}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.5}
            >
              {secondFighterName}
            </Text>
            <Image
              source={{ uri: secondFighterFlag }}
              style={styles.fighterFlag}
              accessibilityLabel={`${secondFighterName} flag`}
            />
          </View>
          {/* Second Fighter Score / Record */}
          <ScoreText
            record={secondFighterRecord ?? "0-0"}
            winner={secondFighterWinner}
          />
        </View>

        {/* First Fighter */}
        <View style={styles.teamSection}>
          <View style={styles.teamWrapper}>
            <View style={styles.fighterContainer}>
              <Image
                source={{ uri: firstFighterPhoto }}
                style={styles.fighter}
                contentFit="contain"
                accessibilityLabel={firstFighterName}
              />
            </View>
            <Text
              style={styles.teamName}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.5}
            >
              {firstFighterName}
            </Text>
            <Image
              source={{ uri: firstFighterFlag }}
              style={styles.fighterFlag}
              accessibilityLabel={`${secondFighterName} headshot`}
            />
          </View>
          {/* First Fighter Score / Record */}
          <ScoreText
            record={firstFighterRecord ?? "0-0"}
            winner={firstFighterWinner}
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
      {/* headlineText */}
      <Text style={[styles.headlineText]}>{headline}</Text>
    </>
  );

  return (
    <TouchableOpacity activeOpacity={activeOpacity} onPress={handlePress}>
      <View style={styles.card}>{renderCardContent()}</View>
    </TouchableOpacity>
  );
}
