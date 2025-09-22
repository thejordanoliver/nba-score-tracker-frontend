import { Fonts } from "constants/fonts";
import { getNFLTeamsLogo } from "constants/teamsNFL";
import { useNFLGameEvents } from "hooks/NFLHooks/useNFLEvents";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import HeadingTwo from "../../Headings/HeadingTwo";

type Props = {
  gameId: string | number;
};
export default function NFLGameEvents({ gameId }: Props) {
  const { events, loading, error } = useNFLGameEvents(gameId);
  const isDark = useColorScheme() === "dark";

  const styles = getStyles(isDark); // generate styles based on isDark

  if (loading) return <Text style={styles.loading}>Loading events...</Text>;
  if (error) return <Text style={styles.error}>{error}</Text>;
  if (!events || events.length === 0) return null;

  function formatQuarter(quarter: string) {
    switch (quarter) {
      case "First":
        return "1st Qtr";
      case "Second":
        return "2nd Qtr";
      case "Third":
        return "3rd Qtr";
      case "Fourth":
        return "4th Qtr";
      case "OT":
        return "OT";
      default:
        return `${quarter} Qtr`;
    }
  }

  return (
    <FlatList
      data={events}
      scrollEnabled={false}
      keyExtractor={(item, idx) => `${item.quarter}-${item.minute}-${idx}`}
      contentContainerStyle={{ paddingVertical: 10 }}
      ListHeaderComponent={<HeadingTwo>Scoring Plays</HeadingTwo>}
      renderItem={({ item }) => (
        <View style={styles.eventRow}>
          {/* Left: Team Logo */}
          <Image
            source={getNFLTeamsLogo(item.team.id, isDark)}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.divder}></View>
          {/* Center: Comment */}
          <View style={styles.commentWrapper}>
            <Text style={styles.comment}>{item.comment}</Text>
          </View>

          {/* Right: Quarter/Time above Score */}
          <View style={styles.right}>
            <Text style={styles.time}>
              {formatQuarter(item.quarter)} {item.minute}'
            </Text>
            <Text style={styles.score}>
              {item.score.home} - {item.score.away}
            </Text>
          </View>
        </View>
      )}
    />
  );
}

// Styles
const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    eventRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 6,
      borderBottomColor: isDark ? "#444" : "#888",
      borderBottomWidth: 1,
      paddingVertical: 8,
      paddingHorizontal: 4,
    },
    logo: {
      width: 42,
      height: 42,
      marginRight: 8,
    },
    commentWrapper: {
      flex: 1,
      justifyContent: "center", // vertically center comment
      marginHorizontal: 8,
      paddingLeft: 8,
    },
    divder: {
      height: "100%",
      width: 1,
      backgroundColor: isDark ? "#444" : "#888",
    },

    comment: {
      fontFamily: Fonts.OSREGULAR,
      fontSize: 12,
      color: isDark ? "#fff" : "#1d1d1d",
      flexWrap: "wrap",
    },
    right: {
      flexDirection: "column", // stack time above score
      alignItems: "flex-end",
      minWidth: 60, // optional to prevent shrinking
    },
    time: {
      fontFamily: Fonts.OSREGULAR,
      fontSize: 12,
      color: isDark ? "#aaa" : "#888",
      textAlign: "right",
    },
    score: {
      fontFamily: Fonts.OSMEDIUM,
      fontSize: 12,
      color: isDark ? "#aaa" : "#888",
      marginTop: 2,
      textAlign: "right",
    },
    loading: {
      color: isDark ? "#fff" : "#000",
    },
    error: {
      color: "red",
    },
    noEvents: {
      color: isDark ? "#ccc" : "#555",
    },
  });
