import type { TennisCompetitor } from "@/types/tennis/tennis";
import { Colors } from "constants/styles";
import { Image } from "expo-image";
import { Text, View } from "react-native";
import {
  CompetitorRowStyles,
  TennisProps,
} from "styles/GameDetailStyles/TeamRow.styles";

function FlagStack({
  competitor,
  isDark,
}: {
  competitor: Pick<TennisCompetitor, "flags" | "country">;
  isDark: boolean;
}) {
  if (!competitor.flags.length) {
    return null;
  }

  const styles = CompetitorRowStyles(isDark);

  return (
    <View style={styles.flagStack}>
      {competitor.flags.slice(0, 2).map((flag, index) => (
        <View
          key={`${flag}-${index}`}
          style={[styles.flagContainer, index > 0 && styles.overlappingFlag]}
        >
          <Image
            source={{ uri: flag }}
            style={styles.flag}
            contentFit="cover"
            accessibilityLabel={competitor.country ?? "Country flag"}
          />
        </View>
      ))}
    </View>
  );
}

export const CompetitorRow = ({
  id,
  flags,
  isHome,
  name,
  flag,
  country,
  rank,
  isWinner,
  serving,
  score,
  state,
  isDark,
}: TennisProps) => {
  const styles = CompetitorRowStyles(isDark);

  const isFinal = state === "post";
  const inProgress = state === "in";

  const competitorFlags = flags.length ? flags : flag ? [flag] : [];

  const getScoreStyle = () => {
    if (isWinner === false && isFinal) {
      return {
        color: Colors.midTone,
        opacity: 0.5,
      };
    }

    if (inProgress) {
      return {
        color: isDark ? Colors.white : Colors.black,
      };
    }

    if (isFinal) {
      return {
        color: isWinner
          ? isDark
            ? Colors.dark.white
            : Colors.light.black
          : Colors.midTone,
      };
    }

    return {
      color: isDark ? Colors.white : Colors.black,
    };
  };

  return (
    <View style={styles.row}>
      {isHome && (inProgress || isFinal) && (
        <View style={styles.scoreWrapper}>
          {serving && <View style={styles.serveIndicator} />}
          <Text style={[styles.score, getScoreStyle()]}>{score}</Text>
        </View>
      )}

      <View style={styles.teamInfoContainer}>
        <FlagStack
          competitor={{
            flags: competitorFlags,
            country,
          }}
          isDark={isDark}
        />

        <View style={styles.teamInfo}>
          <Text
            style={styles.name}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
          >
            {rank ? `${rank} ` : ""}
            {name}
          </Text>
        </View>
      </View>

      {!isHome && (inProgress || isFinal) && (
        <View style={styles.scoreWrapper}>
          {serving && <View style={styles.serveIndicator} />}
          <Text style={[styles.score, getScoreStyle()]}>{score}</Text>
        </View>
      )}
    </View>
  );
};
