import { Ionicons } from "@expo/vector-icons";
import { Colors } from "constants/styles";
import { Text, View } from "react-native";
import { gameInfoStyles } from "styles/GameDetailStyles/GameInfoStyles";
import { BasesIndicator } from "./BasesIndicator";

type CenterInfoProps = {
  state: string | null;
  gameStatusDescription: string;
  gameStatusDetail: string;
  date: string;
  time: string;
  isDark: boolean;
  isTopInning: boolean;
  isBottomInning: boolean;
  broadcast?: string;
  outs: number;
  bases: {
    onFirst: boolean;
    onSecond: boolean;
    onThird: boolean;
  };
};

export function CenterInfo({
  state,
  gameStatusDescription,
  gameStatusDetail,
  date,
  time,
  isDark,
  broadcast,
  isTopInning,
  isBottomInning,
  outs,
  bases,
}: CenterInfoProps) {
  const styles = gameInfoStyles(isDark);

  const isScheduled = gameStatusDescription === "Scheduled";
  const inProgress = gameStatusDescription === "In Progress";
  const isFinal = gameStatusDescription === "Final";
  const isCanceled = gameStatusDescription === "Canceled";
  const isPostponed = gameStatusDescription === "Postponed";
  const isSuspended = gameStatusDescription === "Suspended";
  const isForfeited = gameStatusDescription === "Forfeited";
  const endOfInning = gameStatusDetail.includes("End");
  const isDelayed =
    gameStatusDescription === "Delayed" ||
    gameStatusDescription === "Rain Delay";

  const countOuts = Math.min(Math.max(outs ?? 0, 0), 3);
  const getOuts = [1, 2, 3].map((i) => (
    <Ionicons
      key={i}
      size={8}
      name={i <= countOuts ? "ellipse" : "ellipse-outline"}
      color={isDark ? Colors.dark.lightRed : Colors.light.red}
    />
  ));

  const renderStatus = () => {
    return (
      <View style={styles.container}>
        {/* ⚾ Scheduled */}
        {isScheduled && (
          <View style={styles.infoWrapper}>
            <Text style={styles.date}>{date}</Text>
            <View style={styles.statusDivider} />
            <Text style={styles.date}>{time}</Text>
          </View>
        )}

        {/* 🕒 In Progress */}
        {inProgress && !isDelayed && !endOfInning && (
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
        {endOfInning && (
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
            <Text style={styles.finalText}>{date}</Text>
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

        {/* 📺 Broadcast */}
        {!isFinal && broadcast && (
          <Text style={styles.broadcasts}>{broadcast}</Text>
        )}
      </View>
    );
  };

  return <View>{renderStatus()}</View>;
}
