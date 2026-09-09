import HeadingTwo from "@/components/Headings/HeadingTwo";
import { Colors, Fonts } from "@/constants/styles";
import { StyleSheet, Text, View } from "react-native";

export default function MatchInformation({
  sets,
  division,
  round,
  court,
  venue,
  value,
  isDark,
}: {
  sets: string | null;
  division: string;
  round: string;
  court: string;
  venue: string;
  value?: string | number | null;
  isDark: boolean;
}) {
  const styles = MatchInformationStyles(isDark);

  return (
    <View style={styles.container}>
      <HeadingTwo isDark={isDark}>Match Information</HeadingTwo>
      <View style={styles.wrapper}>
        <View style={styles.row}>
          <Text selectable style={styles.label}>
            Sets
          </Text>
          <Text selectable style={styles.value}>
            {sets}
          </Text>
        </View>

        <View style={styles.row}>
          <Text selectable style={styles.label}>
            Division
          </Text>
          <Text selectable style={styles.value}>
            {division}
          </Text>
        </View>

        <View style={styles.row}>
          <Text selectable style={styles.label}>
            Round
          </Text>
          <Text selectable style={styles.value}>
            {round}
          </Text>
        </View>

        <View style={styles.row}>
          <Text selectable style={styles.label}>
            Court
          </Text>
          <Text selectable style={styles.value}>
            {court}
          </Text>
        </View>

        <View style={styles.row}>
          <Text selectable style={styles.label}>
            Venue
          </Text>
          <Text selectable style={styles.value}>
            {venue}
          </Text>
        </View>
      </View>
    </View>
  );
}

export const MatchInformationStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {},
    wrapper: {
      borderWidth: 1,
      borderColor: Colors.midTone,
      borderRadius: 8,
      overflow: "hidden",
      paddingHorizontal: 12,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 20,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? Colors.lightGray : Colors.darkGray,
      paddingVertical: 12,
    },

    label: {
      color: isDark ? Colors.lightGray : Colors.darkGray,
      fontFamily: Fonts.REGULAR,
      fontSize: 14,
    },

    value: {
      flex: 1,
      color: isDark ? Colors.white : Colors.black,
      fontFamily: Fonts.MEDIUM,
      fontSize: 14,
      textAlign: "right",
    },
  });
