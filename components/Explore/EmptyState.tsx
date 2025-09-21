import { View, Text, useColorScheme } from "react-native";
import { Image } from "expo-image";
import { styles } from "styles/Explore.styles";

export default function EmptyState() {
  const isDark = useColorScheme() === "dark";

  return (
    <View style={styles.centerPrompt}>
      <Image source={require("../../assets/Logos/NBA.png")} style={styles.nbaLogo} resizeMode="contain" />
      <Text style={[styles.promptText, isDark && styles.textDark]}>
        Search for players and teams
      </Text>
    </View>
  );
}
