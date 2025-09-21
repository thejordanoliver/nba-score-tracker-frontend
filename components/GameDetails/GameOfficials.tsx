import { Fonts } from "constants/fonts";
import { StyleSheet, Text, View, useColorScheme } from "react-native";

type Official = {
  fullName: string;
  displayName: string;
  position: { name: string; displayName: string; id: string };
  order: number;
};

type Props = {
  officials: Official[];
};

export default function GameOfficials({ officials }: Props) {
  const theme = useColorScheme();
  if (!officials?.length) return null;

  return (
    <View style={styles.container}>
      <Text
        style={[styles.heading, { color: theme === "dark" ? "#fff" : "#000" }]}
      >
        Officials
      </Text>
      {officials.map((official) => (
        <View key={official.order} style={styles.item}>
          <Text
            style={[styles.name, { color: theme === "dark" ? "#fff" : "#000" }]}
          >
            {official.fullName}
          </Text>
          <Text style={styles.position}>{official.position.displayName}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 12, paddingHorizontal: 16 },
  heading: { fontFamily: Fonts.OSBOLD, fontSize: 16, marginBottom: 8 },
  item: { marginBottom: 6 },
  name: { fontFamily: Fonts.OSMEDIUM, fontSize: 14 },
  position: { fontFamily: Fonts.OSREGULAR, fontSize: 13, color: "#888" },
});
