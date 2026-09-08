import { activeOpacity } from "@/constants/styles";
import { formatDate, formatTime, safeDate } from "@/utils/dateUtils";
import { winnerStyle } from "@/utils/games";
import { usePreferences } from "contexts/PreferencesContext";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { gameCardStyles } from "styles/GamecardStyles/GameCardStyles";
import type { TennisCompetitor, TennisMatch } from "types/tennis/tennis";

type TennisCardStyleSheet = ReturnType<typeof gameCardStyles>;

type Props = {
  match: TennisMatch;
};

function FlagStack({
  competitor,
  styles,
}: {
  competitor: TennisCompetitor;
  styles: TennisCardStyleSheet;
}) {
  return (
    <View style={styles.flagStack}>
      {competitor.flags.slice(0, 2).map((flag, index) => (
        <View
          key={`${flag}-${index}`}
          style={[styles.flagContainer, index > 0 && styles.overlappingFlag]}
        >
          <Image
            key={`${flag}-${index}`}
            source={{ uri: flag }}
            style={[styles.flag]}
            contentFit="cover"
            accessibilityLabel={competitor.country ?? "Country flag"}
          />
        </View>
      ))}
    </View>
  );
}

export default function TennisGameCard({ match }: Props) {
  const router = useRouter();
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = gameCardStyles(isDark);

  const competitors = match.competitors.slice(0, 2);
  const leftCompetitor = competitors[0];
  const rightCompetitor = competitors[1];

  const gameDate = safeDate(match.date);
  const formattedDate = formatDate(gameDate);
  const formattedTime = formatTime(gameDate);

  const state = match.status.state;
  const gameStatusDescription = match?.status.description ?? "";
  const gameStatusDetail = match?.status.detail ?? "";

  const tbd = gameStatusDetail.includes("TBD") ? "TBD" : null;
  const isScheduled = state === "pre";
  const inProgress = state === "in";
  const isFinal = state === "post";
  const isCanceled = gameStatusDescription === "Canceled";
  const isDelayed = gameStatusDescription === "Delayed";
  const isPostponed = gameStatusDescription === "Postponed";
  const isForfeited = gameStatusDescription === "Forfeited";
  const isSuspended = gameStatusDescription === "Suspended";

  const leftScore = leftCompetitor.score;
  const rightScore = rightCompetitor.score;

  const leftServing = leftCompetitor.serving;
  const rightServing = rightCompetitor.serving;

  const leftWins = leftCompetitor.winner ?? false;
  const rightWins = rightCompetitor.winner ?? false;
  const isTie = leftWins === rightWins;

  const leftRank = leftCompetitor.rank;
  const rightRank = rightCompetitor.rank;

  const renderStatus = () => {
    if (inProgress) {
      return (
        <>
          <>
            <View style={styles.infoWrapper}>
              <Text style={styles.finalText}>{gameStatusDetail}</Text>
            </View>
          </>
        </>
      );
    }

    if (isDelayed || isCanceled || isPostponed || isForfeited || isSuspended) {
      return <Text style={styles.finalText}>{gameStatusDescription}</Text>;
    }

    if (isFinal) {
      return (
        <View style={styles.infoWrapper}>
          <Text style={styles.finalText}>{formattedDate}</Text>
          <View style={styles.finalStatusDivider} />
          <Text style={styles.finalText}>{gameStatusDetail}</Text>
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

  const ScoreText = ({
    score,
    isWinner,
  }: {
    score: number;
    isWinner: boolean;
  }) => {
    if (isScheduled) return null;
    return (
      <Text
        style={[
          styles.teamScore,
          winnerStyle({
            isWinner: isWinner,
            isDark: isDark,
            isTie: isTie,
          }),
        ]}
      >
        {score}
      </Text>
    );
  };

  const handlePress = () => {
    if (!match) return;

    router.push({
      pathname: "/game/tennis/[game]",
      params: {
        game: match.id,
        data: encodeURIComponent(JSON.stringify(match)),
      },
    });
  };

  const renderCardContent = () => (
    <>
      <View style={styles.teamSection}>
        <FlagStack competitor={leftCompetitor} styles={styles} />
        <Text
          style={styles.teamName}
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.5}
        >
          {leftRank && <Text style={styles.rank}>{leftRank} </Text>}
          {leftCompetitor.shortName}
        </Text>
      </View>

      <View style={styles.teamSection}>
        <ScoreText score={leftScore} isWinner={leftWins} />
        {leftServing && <View style={styles.serveIndicator} />}
      </View>

      <View style={styles.info}>
        {renderStatus()}
        {!isFinal && <Text style={styles.broadcast}>{match.venue.court}</Text>}
      </View>

      <View style={styles.teamSection}>
        <ScoreText score={rightScore} isWinner={rightWins} />
        {rightServing && <View style={styles.serveIndicator} />}
      </View>

      <View style={styles.teamSection}>
        <FlagStack competitor={rightCompetitor} styles={styles} />
        <Text
          style={styles.teamName}
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.5}
        >
          {rightRank && <Text style={styles.rank}>{rightRank} </Text>}
          {rightCompetitor.shortName}
        </Text>
      </View>
    </>
  );

  return (
    <TouchableOpacity activeOpacity={activeOpacity} onPress={handlePress}>
      <View style={styles.card}>{renderCardContent()}</View>
    </TouchableOpacity>
  );
}
