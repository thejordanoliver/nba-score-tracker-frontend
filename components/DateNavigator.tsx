// components/DateNavigator.tsx
import React from "react";
import { View, TouchableOpacity, Image, Text, StyleSheet } from "react-native";

type Props = {
  selectedDate: Date;
  onChangeDate: (days: number) => void;
  onOpenCalendar: () => void;
  isDark: boolean;
};

export default function DateNavigator({
  selectedDate,
  onChangeDate,
  onOpenCalendar,
  isDark,
}: Props) {
  const styles = getStyles(isDark);

  return (
    <View style={styles.dateNavContainer}>
      <TouchableOpacity
        onPress={() => onChangeDate(-1)}
        style={styles.dateNavButton}
        activeOpacity={0.7}
      >
        <Image
          source={require("../assets/icons8/back.png")}
          style={{ width: 20, height: 20, tintColor: isDark ? "black" : "white" }}
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onOpenCalendar}
        style={styles.dateNavButton}
        activeOpacity={0.7}
      >
        <Text style={styles.dateNavText}>
          {`${selectedDate.toLocaleString("default", {
            month: "short",
          })} ${selectedDate.getDate()}`}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onChangeDate(1)}
        style={styles.dateNavButton}
        activeOpacity={0.7}
      >
        <Image
          source={require("../assets/icons8/forward.png")}
          style={{ width: 20, height: 20, tintColor: isDark ? "black" : "white" }}
        />
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    dateNavContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginVertical: 8,
    },
    dateNavButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginHorizontal: 12,
      backgroundColor: isDark ? "white" : "black",
      borderRadius: 6,
    },
    dateNavText: {
      color: isDark ? "black" : "white",
      fontWeight: "normal",
      fontSize: 18,
      fontFamily: "Oswald_500Medium",
    },
  });
