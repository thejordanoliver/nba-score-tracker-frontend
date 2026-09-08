import { LEAGUE_CONFIG } from "constants/leagues";
import { Colors } from "constants/styles";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import {
  ScaleDecorator,
  type RenderItemParams,
} from "react-native-draggable-flatlist";
import { FavoritesScrollStyles } from "styles/HomeStyles/FavoritesScrollStyles";
import type { FavoriteItem } from "types/favorites";
import {
  getFavoriteTeamLogo,
  getFavoriteTeamRoute,
  isCollegeFavoriteLeague,
} from "utils/favoriteTeams";

type Props = RenderItemParams<FavoriteItem> & {
  styles: ReturnType<typeof FavoritesScrollStyles>;
};

export function FavoritesTab({
  item,
  drag,
  isActive,
  styles,
}: Props) {
  const router = useRouter();
  const isTeam = item.kind === "team";
  const logo = isTeam ? getFavoriteTeamLogo(item) : item.logo;
  const collegeLeague =
    isTeam && isCollegeFavoriteLeague(item.league) ? item.league : null;

  const handlePress = () => {
    void Haptics.selectionAsync();

    if (item.kind === "league") {
      const config = LEAGUE_CONFIG[item.id];

      router.push({
        pathname: config.route,
        params: {
          league: item.id,
          leagueLabel: config.label,
        },
      });
      return;
    }

    router.push({
      pathname: getFavoriteTeamRoute(item.league),
      params: {
        teamId: item.id,
        league: item.league,
      },
    });
  };

  return (
    <View style={styles.cell}>
      <ScaleDecorator activeScale={1.08}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open ${item.name}`}
          accessibilityHint="Long press and drag to reorder"
          accessibilityState={{ disabled: isActive }}
          disabled={isActive}
          delayLongPress={220}
          onPress={handlePress}
          onLongPress={drag}
          style={({ pressed }) => [
            styles.tabContainer,
            pressed && styles.pressed,
            isActive && styles.activeTabContainer,
          ]}
        >
          <View
            style={[
              styles.logoWrapper,
              { backgroundColor: item.color || Colors.midTone },
            ]}
          >
            <Image source={logo} style={styles.logo} contentFit="contain" />
          </View>

          {!collegeLeague && (
            <View style={styles.labelContainer}>
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={styles.tabLabel}
              >
                {item.name}
              </Text>
            </View>
          )}
          {collegeLeague && (
            <View style={styles.labelContainer}>
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={styles.tabLabel}
              >
                {item.name}
              </Text>
              <View style={styles.divider} />
              <Text style={styles.tabLabel}>{item.league.toUpperCase()}</Text>
            </View>
          )}
        </Pressable>
      </ScaleDecorator>
    </View>
  );
}
