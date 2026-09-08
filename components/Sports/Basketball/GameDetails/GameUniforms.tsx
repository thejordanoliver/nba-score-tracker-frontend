// components/GameDetails/GameUniforms.tsx
import HeadingTwo from "components/Headings/HeadingTwo";
import { Colors, Fonts, globalStyles } from "constants/styles";
import { getNBATeam } from "constants/teams";
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

type GameUniformsProps = {
  homeTeamId: number;
  awayTeamId: number;
  isDark: boolean;
};

export default function GameUniforms({
  homeTeamId,
  awayTeamId,
  isDark = false,
}: GameUniformsProps) {
  const homeTeam = getNBATeam(homeTeamId);
  const awayTeam = getNBATeam(awayTeamId);
  const global = globalStyles(isDark);
  const styles = uniformStyles(isDark);

  if (!homeTeam || !awayTeam) {
    return (
      <View style={global.emptyContainer}>
        <Text style={global.emptyText}>Team data not found</Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <HeadingTwo isDark={isDark}>Uniform Matchup</HeadingTwo>
        <View style={styles.wrapper}>
          <View style={styles.uniformsContainer}>
            <Image
              source={awayTeam.uniforms?.away}
              style={styles.uniformsImage}
              contentFit="contain"
            />
            <Text
              style={styles.teamName}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.5}
            >
              {awayTeam.name} Away
            </Text>
          </View>

          <Text style={styles.vs}>vs</Text>

          <View style={styles.uniformsContainer}>
            <Image
              source={homeTeam.uniforms?.home}
              style={styles.uniformsImage}
              contentFit="contain"
            />
            <Text
              style={styles.teamName}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.5}
            >
              {homeTeam.name} Home
            </Text>
          </View>
        </View>
      </View>
    </>
  );
}

const uniformStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      justifyContent: "center",
    },
    wrapper: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: Colors.midTone,
      borderRadius: 8,
    },

    uniformsContainer: {
      alignItems: "center",
      padding: 12,
    },
    uniformsImage: {
      width: 200,
      height: 200,
    },
    teamName: {
      marginTop: 6,
      fontFamily: Fonts.MEDIUM,
      fontSize: 14,
      color: isDark ? Colors.white : Colors.black,
    },
    divider: {
      width: 1,
      height: "100%",
    },
    center: {
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
    },

    vs: {
      marginHorizontal: 8,
      fontFamily: Fonts.BOLD,
      fontSize: 24,
      color: isDark ? Colors.white : Colors.black,
    },
  });
