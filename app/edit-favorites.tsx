import { CustomHeaderTitle } from "components/CustomHeaderTitle";
import FavoriteTeamsSelector from "components/Favorites/FavoriteTeamsSelector";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useLayoutEffect } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
  useWindowDimensions,
} from "react-native";
import { Fonts } from "constants/fonts";
import { useFavoriteTeams } from "hooks/useFavoriteTeams";
import { teams } from "constants/teams";

export default function EditFavoritesScreen() {
  const {
    search,
    setSearch,
    favorites,
    toggleFavorite,
    isGridView,
    toggleLayout,
    fadeAnim,
    username,
    saveFavorites,
    isLoading,
  } = useFavoriteTeams();

  const { width: screenWidth } = useWindowDimensions();
  const numColumns = 3;
  const containerPadding = 40;
  const columnGap = 12;
  const totalSpacing = columnGap * (numColumns - 1);
  const availableWidth = screenWidth - containerPadding - totalSpacing;
  const itemWidth = availableWidth / numColumns;

  const navigation = useNavigation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = getStyles(isDark);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <CustomHeaderTitle
          title="Edit Favorites"
          onBack={() => router.back()}
          onToggleLayout={toggleLayout}
          isGrid={isGridView}
        />
      ),
    });
  }, [navigation, isGridView]);

  const handleSave = async () => {
    const success = await saveFavorites();
    if (success) router.back();
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search teams..."
        placeholderTextColor={isDark ? "#888" : "#999"}
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
      />

      <Animated.View style={{ flex: 1, opacity: fadeAnim, marginTop: 12 }}>
        <FavoriteTeamsSelector
          teams={teams}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
          isGridView={isGridView}
          fadeAnim={fadeAnim}
          search={search}
          itemWidth={itemWidth}
          loading={isLoading}
        />
      </Animated.View>

      <Pressable
        onPress={handleSave}
        disabled={!username}
        style={[styles.saveButton, !username && { opacity: 0.5 }]}
      >
        <Text style={styles.saveText}>Save</Text>
      </Pressable>
    </View>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: isDark ? "#1d1d1d" : "#fff",
    },
    input: {
      borderWidth: 1,
      borderColor: "#888",
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 16,
      color: "#000",
      fontFamily: Fonts.OSLIGHT,
    },
    saveButton: {
      backgroundColor: isDark ? "#fff" : "#1d1d1d",
      padding: 16,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 16,
      marginBottom: 20,
    },
    saveText: {
      color: isDark ? "#000" : "#fff",
      fontSize: 16,
      fontFamily: Fonts.OSMEDIUM,
    },
  });
