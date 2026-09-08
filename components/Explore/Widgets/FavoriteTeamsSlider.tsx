import { Colors } from "@/constants/styles";
import { FavoriteTeamsSliderStyles } from "@/styles/ExploreStyles/FavoriteTeamsSliderStyles";
import PlaceholderLogo from "assets/Placeholders/teamPlaceholder.png";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  FlatList,
  Image,
  ImageSourcePropType,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  Text,
  View,
} from "react-native";
import { getTeamRoute } from "utils/teams";
import type { FavoriteLeague, FavoriteTeamKey } from "types/favorites";

export type FavoriteTeamSlide = {
  favorite: {
    key: FavoriteTeamKey;
    league: FavoriteLeague;
    id: string;
  };
  name: string;
  fullName?: string;
  logo?: ImageSourcePropType;
  color?: string;
  secondaryColor?: string;
  code?: string;
};

type FavoriteTeamsSliderProps = {
  teams: FavoriteTeamSlide[];
  width: number;
  height: number;
  isDark: boolean;
  compact?: boolean;
};

export default function FavoriteTeamsSlider({
  teams,
  width,
  height,
  isDark,
  compact = false,
}: FavoriteTeamsSliderProps) {
  const router = useRouter();
  const listRef = useRef<FlatList<FavoriteTeamSlide>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const styles = FavoriteTeamsSliderStyles(isDark, compact);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      setCurrentIndex(Math.round(event.nativeEvent.contentOffset.x / width));
    },
    [width],
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<FavoriteTeamSlide> | null | undefined, index: number) => ({
      length: width,
      offset: width * index,
      index,
    }),
    [width],
  );

  const renderSlide = useCallback(
    ({ item }: { item: FavoriteTeamSlide }) => {
      return (
        <View style={[styles.slide, { width, height }]}>
          <Pressable
            style={styles.slideButton}
            onPress={() =>
              router.push({
                pathname: getTeamRoute(item.favorite.league) as any,
                params: { teamId: item.favorite.id },
              })
            }
          >
            <LinearGradient
              colors={[
                item.color ?? Colors.midTone,
                isDark ? Colors.black : Colors.white,
              ]}
              locations={isDark ? [0, 0.8] : [0, 0.8]}
              start={{
                x: 0.5,
                y: 0,
              }}
              end={{
                x: 0.5,
                y: 1,
              }}
              style={styles.teamGlow}
            />

            {item.logo && <Image source={item.logo} style={styles.teamLogo} />}
            {!item?.logo && (
              <Image source={PlaceholderLogo} style={styles.teamLogo} />
            )}
            <View style={styles.teamTextWrap}>
              <Text
                style={styles.teamName}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.fullName}
              </Text>
              <Text style={styles.leagueText}>
                {item.favorite.league.toUpperCase()}
              </Text>
            </View>
          </Pressable>
        </View>
      );
    },
    [height, router, styles, width, isDark],
  );

  return (
    <View style={[styles.container, { width, height }]}>
      <FlatList
        ref={listRef}
        data={teams}
        keyExtractor={(item) => item.favorite.key}
        horizontal
        pagingEnabled
        snapToInterval={width}
        decelerationRate="fast"
        disableIntervalMomentum
        directionalLockEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={getItemLayout}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={renderSlide}
        style={styles.list}
      />

      {teams.length > 1 && (
        <View style={styles.dots}>
          {teams.map((team, index) => (
            <View
              key={team.favorite.key}
              style={[styles.dot, index === currentIndex && styles.activeDot]}
            />
          ))}
        </View>
      )}
    </View>
  );
}
