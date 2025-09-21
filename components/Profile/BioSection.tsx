import React from "react";
import { Text, View } from "react-native";
import { getStyles } from "../../styles/ProfileScreen.styles";

type Props = {
  bio?: string | null;
  isDark: boolean;
};

export default function BioSection({ bio, isDark }: Props) {
  const styles = getStyles(isDark);

  return (
    <View style={styles.bioContainer}>
      <Text style={styles.bioText}>{bio || ""}</Text>
    </View>
  );
}
